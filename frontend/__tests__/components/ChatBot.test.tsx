import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatBot from '../../components/ChatBot';

// Mock the backend
jest.mock('~backend/client', () => ({
  __esModule: true,
  default: {
    ai: {
      chat: jest.fn(),
    },
  },
}));

// Mock the toast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('ChatBot', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    const backend = require('~backend/client').default;
    backend.ai.chat.mockResolvedValue({
      response: 'This is a test response from the AI assistant.',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders chat button when closed', () => {
    render(<ChatBot />);
    
    const chatButton = screen.getByRole('button');
    expect(chatButton).toBeInTheDocument();
  });

  it('opens chat interface when button is clicked', async () => {
    render(<ChatBot />);
    
    const chatButton = screen.getByRole('button');
    await user.click(chatButton);
    
    expect(screen.getByText('SCRIBE AI')).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
  });

  it('displays welcome message when opened', async () => {
    render(<ChatBot />);
    
    const chatButton = screen.getByRole('button');
    await user.click(chatButton);
    
    expect(screen.getByText(/Welcome to SCRIBE AI/)).toBeInTheDocument();
  });

  it('sends message and receives response', async () => {
    render(<ChatBot />);
    
    const chatButton = screen.getByRole('button');
    await user.click(chatButton);
    
    const input = screen.getByPlaceholderText('Ask me anything about your notes...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await user.type(input, 'Test message');
    await user.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByText('This is a test response from the AI assistant.')).toBeInTheDocument();
    });
  });

  it('handles Enter key to send message', async () => {
    render(<ChatBot />);
    
    const chatButton = screen.getByRole('button');
    await user.click(chatButton);
    
    const input = screen.getByPlaceholderText('Ask me anything about your notes...');
    
    await user.type(input, 'Test message{enter}');
    
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  it('disables input while loading', async () => {
    const backend = require('~backend/client').default;
    backend.ai.chat.mockImplementation(() => new Promise(() => {}));
    
    render(<ChatBot />);
    
    const chatButton = screen.getByRole('button');
    await user.click(chatButton);
    
    const input = screen.getByPlaceholderText('Ask me anything about your notes...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await user.type(input, 'Test message');
    await user.click(sendButton);
    
    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('closes chat when X button is clicked', async () => {
    render(<ChatBot />);
    
    const chatButton = screen.getByRole('button');
    await user.click(chatButton);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    expect(screen.queryByText('SCRIBE AI')).not.toBeInTheDocument();
  });

  it('includes context in chat request when provided', async () => {
    const context = 'Test context about a meeting';
    render(<ChatBot context={context} />);
    
    const chatButton = screen.getByRole('button');
    await user.click(chatButton);
    
    const input = screen.getByPlaceholderText('Ask me anything about your notes...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await user.type(input, 'Test message');
    await user.click(sendButton);
    
    const backend = require('~backend/client').default;
    await waitFor(() => {
      expect(backend.ai.chat).toHaveBeenCalledWith({
        message: 'Test message',
        context: context,
        chatHistory: [],
      });
    });
  });
});
