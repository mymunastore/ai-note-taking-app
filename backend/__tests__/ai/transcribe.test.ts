import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock the OpenAI API
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock the secret function
jest.mock('encore.dev/config', () => ({
  secret: jest.fn(() => () => 'mock-api-key'),
}));

// Mock the API function
jest.mock('encore.dev/api', () => ({
  api: jest.fn((options, handler) => handler),
  APIError: {
    invalidArgument: jest.fn((message) => new Error(`InvalidArgument: ${message}`)),
    internal: jest.fn((message) => new Error(`Internal: ${message}`)),
    unavailable: jest.fn((message) => new Error(`Unavailable: ${message}`)),
    resourceExhausted: jest.fn((message) => new Error(`ResourceExhausted: ${message}`)),
  },
}));

describe('AI Transcribe Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should transcribe audio successfully', async () => {
    // Mock successful OpenAI response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        text: 'Hello, this is a test transcription.',
        language: 'en',
      }),
    });

    // Import the transcribe function after mocking
    const { transcribe } = await import('../../ai/transcribe');

    const request = {
      audioBase64: Buffer.from('test audio data').toString('base64'),
    };

    const result = await transcribe(request);

    expect(result).toEqual({
      transcript: 'Hello, this is a test transcription.',
      originalLanguage: 'en',
      translated: false,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/audio/transcriptions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-api-key',
        }),
      })
    );
  });

  it('should handle translation for non-English audio', async () => {
    // Mock detection response (Spanish)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: 'Hola, esta es una transcripción de prueba.',
          language: 'es',
        }),
      })
      // Mock translation response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: 'Hello, this is a test transcription.',
        }),
      });

    const { transcribe } = await import('../../ai/transcribe');

    const request = {
      audioBase64: Buffer.from('test audio data').toString('base64'),
    };

    const result = await transcribe(request);

    expect(result).toEqual({
      transcript: 'Hello, this is a test transcription.',
      originalLanguage: 'es',
      translated: true,
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should reject invalid audio data', async () => {
    const { transcribe } = await import('../../ai/transcribe');
    const { APIError } = await import('encore.dev/api');

    const request = {
      audioBase64: '',
    };

    await expect(transcribe(request)).rejects.toThrow('InvalidArgument');
    expect(APIError.invalidArgument).toHaveBeenCalledWith('Audio data is required');
  });

  it('should handle OpenAI API errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    });

    const { transcribe } = await import('../../ai/transcribe');
    const { APIError } = await import('encore.dev/api');

    const request = {
      audioBase64: Buffer.from('test audio data').toString('base64'),
    };

    await expect(transcribe(request)).rejects.toThrow('InvalidArgument');
    expect(APIError.invalidArgument).toHaveBeenCalledWith('Invalid audio format or corrupted file');
  });

  it('should handle rate limiting', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => 'Rate limit exceeded',
    });

    const { transcribe } = await import('../../ai/transcribe');
    const { APIError } = await import('encore.dev/api');

    const request = {
      audioBase64: Buffer.from('test audio data').toString('base64'),
    };

    await expect(transcribe(request)).rejects.toThrow('ResourceExhausted');
    expect(APIError.resourceExhausted).toHaveBeenCalledWith('Rate limit exceeded. Please try again later');
  });

  it('should reject oversized files', async () => {
    const { transcribe } = await import('../../ai/transcribe');
    const { APIError } = await import('encore.dev/api');

    // Create a large base64 string (over 25MB when decoded)
    const largeAudioData = 'a'.repeat(35 * 1024 * 1024); // 35MB of 'a' characters

    const request = {
      audioBase64: largeAudioData,
    };

    await expect(transcribe(request)).rejects.toThrow('InvalidArgument');
    expect(APIError.invalidArgument).toHaveBeenCalledWith('Audio file too large. Maximum size is 25MB');
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

    const { transcribe } = await import('../../ai/transcribe');
    const { APIError } = await import('encore.dev/api');

    const request = {
      audioBase64: Buffer.from('test audio data').toString('base64'),
    };

    await expect(transcribe(request)).rejects.toThrow('Unavailable');
    expect(APIError.unavailable).toHaveBeenCalledWith('Unable to connect to transcription service. Please check your internet connection');
  });
});
