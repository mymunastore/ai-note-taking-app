import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock the OpenAI chat function
const mockOpenAIChat = jest.fn();
jest.mock('../../ai/utils', () => ({
  openAIChat: mockOpenAIChat,
  hashString: jest.fn((input: string) => `hash_${input.length}`),
}));

// Mock the cache functions
const mockGetCached = jest.fn();
const mockSetCached = jest.fn();
jest.mock('../../ai/cache', () => ({
  getCached: mockGetCached,
  setCached: mockSetCached,
}));

// Mock the API function
jest.mock('encore.dev/api', () => ({
  api: jest.fn((options, handler) => handler),
  APIError: {
    invalidArgument: jest.fn((message) => new Error(`InvalidArgument: ${message}`)),
    internal: jest.fn((message) => new Error(`Internal: ${message}`)),
  },
}));

describe('AI Summarize Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCached.mockResolvedValue(null); // No cache by default
    mockSetCached.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should summarize transcript successfully', async () => {
    mockOpenAIChat.mockResolvedValueOnce(`
# Meeting Summary

## Key Points
- Discussed project timeline
- Reviewed budget allocation
- Assigned team responsibilities

## Action Items
- Complete design mockups by Friday
- Schedule client review meeting
- Update project documentation

## Participants
- Project Manager
- Lead Developer
- UI/UX Designer

## Outcomes
- Approved project scope
- Established clear deadlines
- Defined communication protocols
    `);

    const { summarize } = await import('../../ai/summarize');

    const request = {
      transcript: 'This is a test meeting transcript discussing project timeline, budget, and team assignments.',
      length: 'medium' as const,
      format: 'bullets' as const,
    };

    const result = await summarize(request);

    expect(result.summary).toContain('Key Points');
    expect(result.summary).toContain('Action Items');
    expect(result.summary).toContain('project timeline');

    expect(mockOpenAIChat).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          role: 'system',
          content: expect.stringContaining('expert at summarizing meeting transcripts'),
        }),
        expect.objectContaining({
          role: 'user',
          content: expect.stringContaining('Please summarize this transcript (medium length)'),
        }),
      ]),
      expect.objectContaining({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 700,
      })
    );
  });

  it('should return cached summary if available', async () => {
    const cachedSummary = {
      summary: 'This is a cached summary of the meeting.',
    };

    mockGetCached.mockResolvedValueOnce(cachedSummary);

    const { summarize } = await import('../../ai/summarize');

    const request = {
      transcript: 'This is a test transcript.',
      length: 'short' as const,
      format: 'paragraph' as const,
    };

    const result = await summarize(request);

    expect(result).toEqual(cachedSummary);
    expect(mockOpenAIChat).not.toHaveBeenCalled();
    expect(mockGetCached).toHaveBeenCalled();
  });

  it('should cache the generated summary', async () => {
    const generatedSummary = 'This is a generated summary.';
    mockOpenAIChat.mockResolvedValueOnce(generatedSummary);

    const { summarize } = await import('../../ai/summarize');

    const request = {
      transcript: 'This is a test transcript.',
      length: 'long' as const,
      format: 'bullets' as const,
    };

    await summarize(request);

    expect(mockSetCached).toHaveBeenCalledWith(
      expect.any(String),
      { summary: generatedSummary },
      { ttlSeconds: 60 * 60 * 24 * 7 } // 7 days
    );
  });

  it('should reject empty transcript', async () => {
    const { summarize } = await import('../../ai/summarize');
    const { APIError } = await import('encore.dev/api');

    const request = {
      transcript: '',
      length: 'medium' as const,
      format: 'bullets' as const,
    };

    await expect(summarize(request)).rejects.toThrow('InvalidArgument');
    expect(APIError.invalidArgument).toHaveBeenCalledWith('Transcript is required and cannot be empty');
  });

  it('should reject transcript that is too short', async () => {
    const { summarize } = await import('../../ai/summarize');
    const { APIError } = await import('encore.dev/api');

    const request = {
      transcript: 'Short',
      length: 'medium' as const,
      format: 'bullets' as const,
    };

    await expect(summarize(request)).rejects.toThrow('InvalidArgument');
    expect(APIError.invalidArgument).toHaveBeenCalledWith('Transcript too short. Minimum length is 10 characters');
  });

  it('should reject transcript that is too long', async () => {
    const { summarize } = await import('../../ai/summarize');
    const { APIError } = await import('encore.dev/api');

    const request = {
      transcript: 'a'.repeat(100001), // Over 100,000 characters
      length: 'medium' as const,
      format: 'bullets' as const,
    };

    await expect(summarize(request)).rejects.toThrow('InvalidArgument');
    expect(APIError.invalidArgument).toHaveBeenCalledWith('Transcript too long. Maximum length is 100,000 characters');
  });

  it('should handle OpenAI API errors', async () => {
    mockOpenAIChat.mockRejectedValueOnce(new Error('OpenAI API error'));

    const { summarize } = await import('../../ai/summarize');
    const { APIError } = await import('encore.dev/api');

    const request = {
      transcript: 'This is a valid transcript for testing error handling.',
      length: 'medium' as const,
      format: 'bullets' as const,
    };

    await expect(summarize(request)).rejects.toThrow('Internal');
    expect(APIError.internal).toHaveBeenCalledWith('Failed to generate summary. Please try again');
  });

  it('should handle empty response from OpenAI', async () => {
    mockOpenAIChat.mockResolvedValueOnce('');

    const { summarize } = await import('../../ai/summarize');
    const { APIError } = await import('encore.dev/api');

    const request = {
      transcript: 'This is a valid transcript for testing empty response.',
      length: 'medium' as const,
      format: 'bullets' as const,
    };

    await expect(summarize(request)).rejects.toThrow('Internal');
    expect(APIError.internal).toHaveBeenCalledWith('Failed to generate summary');
  });
});
