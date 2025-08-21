import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from '../../pages/SettingsPage';
import { ThemeProvider } from '../../contexts/ThemeContext';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};

describe('SettingsPage', () => {
  const user = userEvent.setup();

  it('renders settings page header', () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    expect(screen.getByText('Settings & Information')).toBeInTheDocument();
    expect(screen.getByText(/Configure your AI note-taking preferences/)).toBeInTheDocument();
  });

  it('displays appearance settings', () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.getByText('Color Scheme')).toBeInTheDocument();
  });

  it('shows AI technology stack information', () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    expect(screen.getByText('AI Technology Stack')).toBeInTheDocument();
    expect(screen.getByText('Speech Recognition')).toBeInTheDocument();
    expect(screen.getByText('OpenAI Whisper')).toBeInTheDocument();
    expect(screen.getByText('Text Generation')).toBeInTheDocument();
    expect(screen.getByText('GPT-4o-mini')).toBeInTheDocument();
  });

  it('displays performance and storage information', () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    expect(screen.getByText('Performance & Storage')).toBeInTheDocument();
    expect(screen.getByText('Backend Framework')).toBeInTheDocument();
    expect(screen.getByText('Encore.ts')).toBeInTheDocument();
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
  });

  it('shows application details', () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    expect(screen.getByText('Application Details')).toBeInTheDocument();
    expect(screen.getByText('Version')).toBeInTheDocument();
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
    expect(screen.getByText('Build Type')).toBeInTheDocument();
    expect(screen.getByText('Production')).toBeInTheDocument();
  });

  it('displays features section', () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Multi-Language Auto-Detection')).toBeInTheDocument();
    expect(screen.getByText('AI Chat Assistant')).toBeInTheDocument();
    expect(screen.getByText('Smart Search')).toBeInTheDocument();
  });

  it('shows privacy and security information', () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    expect(screen.getByText('Privacy & Security')).toBeInTheDocument();
    expect(screen.getByText(/Enhanced Security/)).toBeInTheDocument();
    expect(screen.getByText(/AI Processing/)).toBeInTheDocument();
    expect(screen.getByText(/Zero Retention/)).toBeInTheDocument();
  });

  it('displays system requirements', () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    expect(screen.getByText('System Requirements & Compatibility')).toBeInTheDocument();
    expect(screen.getByText('Minimum Requirements')).toBeInTheDocument();
    expect(screen.getByText('Optimal Performance')).toBeInTheDocument();
  });

  it('toggles theme when theme button is clicked', async () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    const themeButton = screen.getByText('Dark Mode');
    await user.click(themeButton);

    // After clicking, it should show "Light Mode" (since we switched to dark)
    expect(screen.getByText('Light Mode')).toBeInTheDocument();
  });

  it('shows browser compatibility information', () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    expect(screen.getByText(/Chrome 90\+, Firefox 88\+/)).toBeInTheDocument();
    expect(screen.getByText(/4GB RAM recommended/)).toBeInTheDocument();
    expect(screen.getByText(/Stable internet connection/)).toBeInTheDocument();
  });
});
