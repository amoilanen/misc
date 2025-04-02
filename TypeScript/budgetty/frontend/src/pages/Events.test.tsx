import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { ToastContainer } from 'react-toastify';
import Events from './Events';
import theme from '../theme';
import { useEvents } from '../hooks/useEvents';
import { useCategories } from '../hooks/useCategories';

// Mock the hooks
vi.mock('../hooks/useEvents', () => ({
  useEvents: vi.fn(),
}));

vi.mock('../hooks/useCategories', () => ({
  useCategories: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const mockEvents = [
  {
    id: 1,
    type: 'expense',
    amount: 100,
    description: 'Test expense',
    date: new Date().toISOString(),
    categoryId: 1,
    category: {
      id: 1,
      name: 'Food',
      type: 'expense',
      color: '#FF0000',
      icon: 'restaurant',
    },
  },
];

const mockCategories = [
  {
    id: 1,
    name: 'Food',
    type: 'expense',
    color: '#FF0000',
    icon: 'restaurant',
  },
];

const renderEvents = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Events />
          <ToastContainer />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('Events Component', () => {
  const mockCreateEvent = vi.fn();
  const mockUpdateEvent = vi.fn();
  const mockDeleteEvent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useEvents as any).mockReturnValue({
      events: mockEvents,
      isLoading: false,
      error: null,
      createEvent: mockCreateEvent,
      updateEvent: mockUpdateEvent,
      deleteEvent: mockDeleteEvent,
    });
    (useCategories as any).mockReturnValue({
      categories: mockCategories,
      isLoading: false,
      error: null,
    });
  });

  it('renders events list', () => {
    renderEvents();
    
    expect(screen.getByText('Test expense')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('opens create event dialog when clicking add button', () => {
    renderEvents();
    
    const addButton = screen.getByRole('button', { name: /add event/i });
    fireEvent.click(addButton);

    expect(screen.getByText(/create event/i)).toBeInTheDocument();
  });

  it('creates a new event', async () => {
    renderEvents();
    
    // Open create dialog
    const addButton = screen.getByRole('button', { name: /add event/i });
    fireEvent.click(addButton);

    // Fill form
    const amountInput = screen.getByLabelText(/amount/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const categorySelect = screen.getByLabelText(/category/i);

    fireEvent.change(amountInput, { target: { value: '200' } });
    fireEvent.change(descriptionInput, { target: { value: 'New expense' } });
    fireEvent.change(categorySelect, { target: { value: '1' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateEvent).toHaveBeenCalledWith({
        amount: 200,
        description: 'New expense',
        categoryId: 1,
        type: 'expense',
      });
    });
  });

  it('opens edit event dialog when clicking edit button', () => {
    renderEvents();
    
    const editButton = screen.getByTestId('edit-event-1');
    fireEvent.click(editButton);

    expect(screen.getByText(/edit event/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test expense')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
  });

  it('updates an event', async () => {
    renderEvents();
    
    // Open edit dialog
    const editButton = screen.getByTestId('edit-event-1');
    fireEvent.click(editButton);

    // Update form
    const amountInput = screen.getByLabelText(/amount/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    fireEvent.change(amountInput, { target: { value: '150' } });
    fireEvent.change(descriptionInput, { target: { value: 'Updated expense' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /update/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateEvent).toHaveBeenCalledWith(1, {
        amount: 150,
        description: 'Updated expense',
      });
    });
  });

  it('deletes an event', async () => {
    renderEvents();
    
    const deleteButton = screen.getByTestId('delete-event-1');
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteEvent).toHaveBeenCalledWith(1);
    });
  });

  it('shows loading state', () => {
    (useEvents as any).mockReturnValue({
      events: [],
      isLoading: true,
      error: null,
      createEvent: mockCreateEvent,
      updateEvent: mockUpdateEvent,
      deleteEvent: mockDeleteEvent,
    });

    renderEvents();
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error message', () => {
    const errorMessage = 'Failed to load events';
    (useEvents as any).mockReturnValue({
      events: [],
      isLoading: false,
      error: errorMessage,
      createEvent: mockCreateEvent,
      updateEvent: mockUpdateEvent,
      deleteEvent: mockDeleteEvent,
    });

    renderEvents();
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
}); 