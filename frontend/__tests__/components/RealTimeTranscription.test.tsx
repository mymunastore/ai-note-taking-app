import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RealTimeTranscription from '../../components/RealTimeTranscription';

// Mock the toast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock Web APIs
const mockMediaDevices = {
  getUserMedia: jest.fn(),
};

const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  ondataavailable: null,
  onerror: null,
  onstart: null,
  onend: null,
  state: 'inactive',
  stream: {
    getTracks: () => [{ stop: jest.fn() }],
  },
};

const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  onstart: null,
  onend: null,
  onresult: null,
  onerror: null,
  continuous: false,
  interimResults: false,
  lang: 'en-US',
};

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: mockMediaDevices,
  writable: true,
});

Object.defineProperty(global.window, 'MediaRecorder', {
  value: jest.fn(() => mockMediaRecorder),
  writable: true,
});

Object.defineProperty(global.window, 'webkitSpeechRecognition', {
  value: jest.fn(() => mockSpeechRecognition),
  writable: true,
});

Object.defineProperty(global.window, 'AudioContext', {
  value: jest.fn(() => ({
    createAnalyser: jest.fn(() => ({
      fftSize: 256,
      frequencyBinCount: 128,
      getByteFrequencyData: jest.fn(),
    })),
    createMediaStreamSource: jest.fn(() => ({
      connect: jest.fn(),
    })),
    close: jest.fn(),
  })),
  writable: true,
});

describe('RealTimeTranscription', () => {
  const user = userEvent.setup();
  const mockOnTranscriptUpdate = jest.fn();
  const mockOnLanguageDetected = jest.fn();

  beforeEach(() => {
    mockMediaDevices.getUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders real-time transcription interface', () => {
    render(
      <RealTimeTranscription
        onTranscriptUpdate={mockOnTranscriptUpdate}
        onLanguageDetected={mockOnLanguageDetected}
      />
    );

    expect(screen.getByText('Real-Time Transcription')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('Click to start')).toBeInTheDocument();
  });

  it('starts listening when microphone button is clicked', async () => {
    render(
      <RealTimeTranscription
        onTranscriptUpdate={mockOnTranscriptUpdate}
        onLanguageDetected={mockOnLanguageDetected}
      />
    );

    const micButton = screen.getByRole('button', { name: /start listening/i });
    await user.click(micButton);

    expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
  });

  it('displays status indicators', () => {
    render(
      <RealTimeTranscription
        onTranscriptUpdate={mockOnTranscriptUpdate}
        onLanguageDetected={mockOnLanguageDetected}
      />
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(screen.getByText('Confidence')).toBeInTheDocument();
    expect(screen.getByText('Words')).toBeInTheDocument();
  });

  it('shows settings controls', () => {
    render(
      <RealTimeTranscription
        onTranscriptUpdate={mockOnTranscriptUpdate}
        onLanguageDetected={mockOnLanguageDetected}
      />
    );

    expect(screen.getByText('Auto Language Detection')).toBeInTheDocument();
    expect(screen.getByText('Continuous Mode')).toBeInTheDocument();
    expect(screen.getByText('Target Language')).toBeInTheDocument();
  });

  it('displays live transcript area', () => {
    render(
      <RealTimeTranscription
        onTranscriptUpdate={mockOnTranscriptUpdate}
        onLanguageDetected={mockOnLanguageDetected}
      />
    );

    expect(screen.getByText('Live Transcript')).toBeInTheDocument();
    expect(screen.getByText('Start speaking to see live transcription...')).toBeInTheDocument();
  });

  it('clears transcript when clear button is clicked', async () => {
    render(
      <RealTimeTranscription
        onTranscriptUpdate={mockOnTranscriptUpdate}
        onLanguageDetected={mockOnLanguageDetected}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(screen.getByText('Start speaking to see live transcription...')).toBeInTheDocument();
  });

  it('handles microphone permission error', async () => {
    mockMediaDevices.getUserMedia.mockRejectedValue(new Error('Permission denied'));

    render(
      <RealTimeTranscription
        onTranscriptUpdate={mockOnTranscriptUpdate}
        onLanguageDetected={mockOnLanguageDetected}
      />
    );

    const micButton = screen.getByRole('button', { name: /start listening/i });
    await user.click(micButton);

    await waitFor(() => {
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalled();
    });
  });

  it('updates language setting', async () => {
    render(
      <RealTimeTranscription
        onTranscriptUpdate={mockOnTranscriptUpdate}
        onLanguageDetected={mockOnLanguageDetected}
      />
    );

    const languageSelect = screen.getByDisplayValue('Auto-detect');
    await user.click(languageSelect);

    const spanishOption = screen.getByText('Spanish');
    await user.click(spanishOption);

    expect(screen.getByDisplayValue('Spanish')).toBeInTheDocument();
  });
});
