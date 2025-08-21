import React from 'react';
import { render, screen } from '@testing-library/react';
import LiveTranscriptionPage from '../../pages/LiveTranscriptionPage';

// Mock the toast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock Web APIs for RealTimeTranscription component
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    }),
  },
  writable: true,
});

Object.defineProperty(global.window, 'webkitSpeechRecognition', {
  value: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    onstart: null,
    onend: null,
    onresult: null,
    onerror: null,
    continuous: false,
    interimResults: false,
    lang: 'en-US',
  })),
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

describe('LiveTranscriptionPage', () => {
  it('renders live transcription page header', () => {
    render(<LiveTranscriptionPage />);

    expect(screen.getByText('Live Transcription')).toBeInTheDocument();
    expect(screen.getByText('Real-Time')).toBeInTheDocument();
    expect(screen.getByText(/Experience real-time speech-to-text/)).toBeInTheDocument();
  });

  it('displays the real-time transcription component', () => {
    render(<LiveTranscriptionPage />);

    // The RealTimeTranscription component should be rendered
    expect(screen.getByText('Real-Time Transcription')).toBeInTheDocument();
  });

  it('shows live transcription interface elements', () => {
    render(<LiveTranscriptionPage />);

    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('Click to start')).toBeInTheDocument();
  });
});
