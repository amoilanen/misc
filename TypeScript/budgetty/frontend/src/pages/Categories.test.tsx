import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { ToastContainer } from 'react-toastify';
import Categories from './Categories';
import theme from '../theme';
import { useCategories } from '../hooks/useCategories';

// Mock the hook
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

const mockCategories = [
  {
    id: 1,
    name: 'Food',
    type: 'expense',
    color: '#FF0000',
    icon: 'restaurant',
  },
  {
    id: 2,
    name: 'Transportation',
    type: 'expense',
    color: '#00FF00',
    icon: 'directions_car',
  },
];

const renderCategories = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Categories />
          <ToastContainer />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('Categories Component', () => {
  const mockCreateCategory = vi.fn();
  const mockUpdateCategory = vi.fn();
  const mockDeleteCategory = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useCategories as any).mockReturnValue({
      categories: mockCategories,
      isLoading: false,
      error: null,
      createCategory: mockCreateCategory,
      updateCategory: mockUpdateCategory,
      deleteCategory: mockDeleteCategory,
    });
  });

  it('renders categories list', () => {
    renderCategories();
    
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Transportation')).toBeInTheDocument();
  });

  it('opens create category dialog when clicking add button', () => {
    renderCategories();
    
    const addButton = screen.getByRole('button', { name: /add category/i });
    fireEvent.click(addButton);

    expect(screen.getByText(/create category/i)).toBeInTheDocument();
  });

  it('creates a new category', async () => {
    renderCategories();
    
    // Open create dialog
    const addButton = screen.getByRole('button', { name: /add category/i });
    fireEvent.click(addButton);

    // Fill form
    const nameInput = screen.getByLabelText(/name/i);
    const typeSelect = screen.getByLabelText(/type/i);
    const colorInput = screen.getByLabelText(/color/i);
    const iconInput = screen.getByLabelText(/icon/i);

    fireEvent.change(nameInput, { target: { value: 'Entertainment' } });
    fireEvent.change(typeSelect, { target: { value: 'expense' } });
    fireEvent.change(colorInput, { target: { value: '#0000FF' } });
    fireEvent.change(iconInput, { target: { value: 'movie' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalledWith({
        name: 'Entertainment',
        type: 'expense',
        color: '#0000FF',
        icon: 'movie',
      });
    });
  });

  it('opens edit category dialog when clicking edit button', () => {
    renderCategories();
    
    const editButton = screen.getByTestId('edit-category-1');
    fireEvent.click(editButton);

    expect(screen.getByText(/edit category/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Food')).toBeInTheDocument();
    expect(screen.getByDisplayValue('#FF0000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('restaurant')).toBeInTheDocument();
  });

  it('updates a category', async () => {
    renderCategories();
    
    // Open edit dialog
    const editButton = screen.getByTestId('edit-category-1');
    fireEvent.click(editButton);

    // Update form
    const nameInput = screen.getByLabelText(/name/i);
    const colorInput = screen.getByLabelText(/color/i);

    fireEvent.change(nameInput, { target: { value: 'Groceries' } });
    fireEvent.change(colorInput, { target: { value: '#FF00FF' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /update/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateCategory).toHaveBeenCalledWith(1, {
        name: 'Groceries',
        color: '#FF00FF',
      });
    });
  });

  it('deletes a category', async () => {
    renderCategories();
    
    const deleteButton = screen.getByTestId('delete-category-1');
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteCategory).toHaveBeenCalledWith(1);
    });
  });

  it('shows loading state', () => {
    (useCategories as any).mockReturnValue({
      categories: [],
      isLoading: true,
      error: null,
      createCategory: mockCreateCategory,
      updateCategory: mockUpdateCategory,
      deleteCategory: mockDeleteCategory,
    });

    renderCategories();
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error message', () => {
    const errorMessage = 'Failed to load categories';
    (useCategories as any).mockReturnValue({
      categories: [],
      isLoading: false,
      error: errorMessage,
      createCategory: mockCreateCategory,
      updateCategory: mockUpdateCategory,
      deleteCategory: mockDeleteCategory,
    });

    renderCategories();
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('filters categories by type', () => {
    renderCategories();
    
    const typeSelect = screen.getByLabelText(/filter by type/i);
    fireEvent.change(typeSelect, { target: { value: 'expense' } });

    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Transportation')).toBeInTheDocument();
  });
}); 