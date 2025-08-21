import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import HomePage from '../../pages/HomePage';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

describe('HomePage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the main heading', () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    );

    expect(screen.getByText('SCRIBE AI')).toBeInTheDocument();
    expect(screen.getByText(/Transform your meetings and calls/)).toBeInTheDocument();
  });

  it('displays feature cards', () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    );

    expect(screen.getByText('Smart Recording')).toBeInTheDocument();
    expect(screen.getByText('Multi-Language Support')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered Summaries')).toBeInTheDocument();
    expect(screen.getByText('Smart Search')).toBeInTheDocument();
    expect(screen.getByText('Project Management')).toBeInTheDocument();
    expect(screen.getByText('Export & Share')).toBeInTheDocument();
  });

  it('shows statistics section', () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    );

    expect(screen.getByText('50+')).toBeInTheDocument();
    expect(screen.getByText('Languages Supported')).toBeInTheDocument();
    expect(screen.getByText('99.9%')).toBeInTheDocument();
    expect(screen.getByText('Transcription Accuracy')).toBeInTheDocument();
  });

  it('displays security features', () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    );

    expect(screen.getByText('Enterprise-Grade Security')).toBeInTheDocument();
    expect(screen.getByText('Local Storage')).toBeInTheDocument();
    expect(screen.getByText('GDPR Compliant')).toBeInTheDocument();
    expect(screen.getByText('Zero Retention')).toBeInTheDocument();
  });

  it('navigates to record page when Get Started is clicked', async () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    );

    const getStartedButton = screen.getByText('Get Started Free');
    await user.click(getStartedButton);

    expect(mockNavigate).toHaveBeenCalledWith('/record');
  });

  it('navigates to record page when Start Recording is clicked', async () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    );

    const startRecordingButtons = screen.getAllByText('Start Recording');
    await user.click(startRecordingButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/record');
  });

  it('shows benefits list', () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    );

    expect(screen.getByText('Save 80% of time on meeting notes')).toBeInTheDocument();
    expect(screen.getByText('Never miss important details again')).toBeInTheDocument();
    expect(screen.getByText('Automatic action item extraction')).toBeInTheDocument();
  });

  it('displays call-to-action sections', () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    );

    expect(screen.getByText('Ready to Transform Your Meetings?')).toBeInTheDocument();
    expect(screen.getByText(/Join thousands of professionals/)).toBeInTheDocument();
  });
});
