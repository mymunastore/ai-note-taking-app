import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecordingProvider, useRecording } from '../../contexts/RecordingContext';

// Mock the toast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock backend
jest.mock('~backend/client', () => ({
  __esModule: true,
  default: {
    ai: {
      transcribe: jest.fn(),
      summarize: jest.fn(),
    },
    notes: {
      create: jest.fn(),
    },
  },
}));

// Mock Web APIs
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  ondataavailable: null,
  onstop: null,
  onerror: null,
  state: 'inactive',
  stream: {
    getTracks: () => [{ stop: jest.fn() }],
  },
};

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    }),
  },
  writable: true,
});

Object.defineProperty(global.window, 'MediaRecorder', {
  value: jest.fn(() => mockMediaRecorder),
  writable: true,
});

// Test component that uses the recording context
const TestComponent: React.FC = () => {
  const {
    isRecording,
    isPaused,
    duration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    isProcessing,
    processRecording,
  } = useRecording();

  return (
    <div>
      <div data-testid="is-recording">{isRecording.toString()}</div>
      <div data-testid="is-paused">{isPaused.toString()}</div>
      <div data-testid="duration">{duration}</div>
      <div data-testid="is-processing">{isProcessing.toString()}</div>
      <button onClick={startRecording}>Start Recording</button>
      <button onClick={pauseRecording}>Pause Recording</button>
      <button onClick={resumeRecording}>Resume Recording</button>
      <button onClick={stopRecording}>Stop Recording</button>
      <button onClick={() => processRecording(new Blob(), 60, 'Test Recording')}>
        Process Recording
      </button>
    </div>
  );
};

describe('RecordingContext', () => {
  beforeEach(() => {
    const backend = require('~backend/client').default;
    backend.ai.transcribe.mockResolvedValue({
      transcript: 'Test transcript',
      originalLanguage: 'en',
      translated: false,
    });
    backend.ai.summarize.mockResolvedValue({
      summary: 'Test summary',
    });
    backend.notes.create.mockResolvedValue({
      id: 1,
      title: 'Test Recording',
      transcript: 'Test transcript',
      summary: 'Test summary',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('provides initial recording state', () => {
    render(
      <RecordingProvider>
        <TestComponent />
      </RecordingProvider>
    );

    expect(screen.getByTestId('is-recording')).toHaveTextContent('false');
    expect(screen.getByTestId('is-paused')).toHaveTextContent('false');
    expect(screen.getByTestId('duration')).toHaveTextContent('0');
    expect(screen.getByTestId('is-processing')).toHaveTextContent('false');
  });

  it('starts recording when startRecording is called', async () => {
    render(
      <RecordingProvider>
        <TestComponent />
      </RecordingProvider>
    );

    const startButton = screen.getByText('Start Recording');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });
  });

  it('processes recording with AI transcription and summarization', async () => {
    render(
      <RecordingProvider>
        <TestComponent />
      </RecordingProvider>
    );

    const processButton = screen.getByText('Process Recording');
    fireEvent.click(processButton);

    await waitFor(() => {
      expect(screen.getByTestId('is-processing')).toHaveTextContent('true');
    });

    await waitFor(() => {
      const backend = require('~backend/client').default;
      expect(backend.ai.transcribe).toHaveBeenCalled();
      expect(backend.ai.summarize).toHaveBeenCalled();
      expect(backend.notes.create).toHaveBeenCalled();
    });
  });

  it('handles recording errors gracefully', async () => {
    const mockGetUserMedia = navigator.mediaDevices.getUserMedia as jest.Mock;
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

    render(
      <RecordingProvider>
        <TestComponent />
      </RecordingProvider>
    );

    const startButton = screen.getByText('Start Recording');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalled();
    });
  });

  it('handles processing errors gracefully', async () => {
    const backend = require('~backend/client').default;
    backend.ai.transcribe.mockRejectedValue(new Error('Transcription failed'));

    render(
      <RecordingProvider>
        <TestComponent />
      </RecordingProvider>
    );

    const processButton = screen.getByText('Process Recording');
    fireEvent.click(processButton);

    await waitFor(() => {
      expect(screen.getByTestId('is-processing')).toHaveTextContent('false');
    });
  });
});
