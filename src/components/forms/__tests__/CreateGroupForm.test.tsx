import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateGroupForm } from '../CreateGroupForm';

const mockOnSubmit = jest.fn();
const mockOnClose = jest.fn();

describe('CreateGroupForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form fields', () => {
    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    expect(screen.getByLabelText('Group Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Description (Optional)')).toBeInTheDocument();
    expect(screen.getByText('Invite Members (Optional)')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Enter email address')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create Group' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    // Check if Input component is being used (should have error styling capability)
    const nameInput = screen.getByLabelText('Group Name *');
    expect(nameInput).toBeInTheDocument();
  });

  it('should render Input component with error', () => {
    const { Input } = jest.requireActual('@/components/ui/Input');
    render(<Input error="Test error message" />);
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(
      <CreateGroupForm
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    expect(screen.queryByLabelText('Group Name *')).not.toBeInTheDocument();
  });

  it('should validate required group name', async () => {
    const user = userEvent.setup();

    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Create Group' });
    await user.click(submitButton);

    expect(screen.getByText('Group name is required')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate group name length', async () => {
    const user = userEvent.setup();

    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const nameInput = screen.getByLabelText('Group Name *');
    const longName = 'a'.repeat(101); // Exceeds 100 character limit

    await user.type(nameInput, longName);

    const submitButton = screen.getByRole('button', { name: 'Create Group' });
    await user.click(submitButton);

    expect(
      screen.getByText('Group name must be 100 characters or less')
    ).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate description length', async () => {
    const user = userEvent.setup();

    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const nameInput = screen.getByLabelText('Group Name *');
    const descriptionInput = screen.getByLabelText('Description (Optional)');
    const longDescription = 'a'.repeat(501); // Exceeds 500 character limit

    await user.type(nameInput, 'Test Group');
    await user.type(descriptionInput, longDescription);

    const submitButton = screen.getByRole('button', { name: 'Create Group' });
    await user.click(submitButton);

    expect(
      screen.getByText('Description must be 500 characters or less')
    ).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();

    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const nameInput = screen.getByLabelText('Group Name *');
    const descriptionInput = screen.getByLabelText('Description (Optional)');

    await user.type(nameInput, 'Test Group');
    await user.type(descriptionInput, 'A test group description');

    const submitButton = screen.getByRole('button', { name: 'Create Group' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Group',
        description: 'A test group description',
      });
    });
  });

  it('should submit form without description', async () => {
    const user = userEvent.setup();

    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const nameInput = screen.getByLabelText('Group Name *');

    await user.type(nameInput, 'Test Group');

    const submitButton = screen.getByRole('button', { name: 'Create Group' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Group',
        description: undefined,
      });
    });
  });

  it('should trim whitespace from inputs', async () => {
    const user = userEvent.setup();

    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const nameInput = screen.getByLabelText('Group Name *');
    const descriptionInput = screen.getByLabelText('Description (Optional)');

    await user.type(nameInput, '  Test Group  ');
    await user.type(descriptionInput, '  A test group description  ');

    const submitButton = screen.getByRole('button', { name: 'Create Group' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Group',
        description: 'A test group description',
      });
    });
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should disable form when submitting', async () => {
    const user = userEvent.setup();

    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const nameInput = screen.getByLabelText('Group Name *');
    const submitButton = screen.getByRole('button', { name: 'Create Group' });

    await user.type(nameInput, 'Test Group');
    await user.click(submitButton);

    // Form should be disabled during submission
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Creating...')).toBeInTheDocument();
  });

  it('should disable form when isLoading is true', () => {
    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={true}
      />
    );

    const nameInput = screen.getByLabelText('Group Name *');
    const submitButton = screen.getByRole('button', { name: 'Create Group' });

    expect(nameInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('should clear errors when user starts typing', async () => {
    const user = userEvent.setup();

    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    // Submit empty form to trigger error
    const submitButton = screen.getByRole('button', { name: 'Create Group' });
    await user.click(submitButton);

    expect(screen.getByText('Group name is required')).toBeInTheDocument();

    // Start typing in name field
    const nameInput = screen.getByLabelText('Group Name *');
    await user.type(nameInput, 'T');

    // Error should be cleared
    expect(
      screen.queryByText('Group name is required')
    ).not.toBeInTheDocument();
  });

  it('should show character count for description', async () => {
    const user = userEvent.setup();

    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const descriptionInput = screen.getByLabelText('Description (Optional)');

    expect(screen.getByText('0/500 characters')).toBeInTheDocument();

    await user.type(descriptionInput, 'Test description');

    expect(screen.getByText('16/500 characters')).toBeInTheDocument();
  });

  it('should reset form when closed', async () => {
    const user = userEvent.setup();

    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const nameInput = screen.getByLabelText('Group Name *');
    const descriptionInput = screen.getByLabelText('Description (Optional)');

    await user.type(nameInput, 'Test Group');
    await user.type(descriptionInput, 'Test description');

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    // Re-open form
    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    // Form should be reset
    expect(screen.getByLabelText('Group Name *')).toHaveValue('');
    expect(screen.getByLabelText('Description (Optional)')).toHaveValue('');
  });

  it('should add member email when valid email is entered', async () => {
    const user = userEvent.setup();

    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const emailInput = screen.getByPlaceholderText('Enter email address');
    const addButton = screen.getByText('Add');

    await user.type(emailInput, 'test@example.com');
    await user.click(addButton);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Remove')).toBeInTheDocument();
    expect(emailInput).toHaveValue('');
  });

  it('should not add invalid email', async () => {
    const user = userEvent.setup();

    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const emailInput = screen.getByPlaceholderText('Enter email address');
    const addButton = screen.getByText('Add');

    await user.type(emailInput, 'invalid-email');
    await user.click(addButton);

    expect(
      screen.getByText('Please enter a valid email address')
    ).toBeInTheDocument();
    expect(screen.queryByText('invalid-email')).not.toBeInTheDocument();
  });

  it('should not add duplicate email', async () => {
    const user = userEvent.setup();

    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const emailInput = screen.getByPlaceholderText('Enter email address');
    const addButton = screen.getByText('Add');

    // Add first email
    await user.type(emailInput, 'test@example.com');
    await user.click(addButton);

    // Try to add same email again
    await user.type(emailInput, 'test@example.com');
    await user.click(addButton);

    expect(screen.getByText('This email is already added')).toBeInTheDocument();
    expect(screen.getAllByText('test@example.com')).toHaveLength(1);
  });

  it('should remove member email when remove button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const emailInput = screen.getByPlaceholderText('Enter email address');
    const addButton = screen.getByText('Add');

    // Add email
    await user.type(emailInput, 'test@example.com');
    await user.click(addButton);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();

    // Remove email
    const removeButton = screen.getByText('Remove');
    await user.click(removeButton);

    expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
  });

  it('should add email when Enter key is pressed', async () => {
    const user = userEvent.setup();

    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const emailInput = screen.getByPlaceholderText('Enter email address');

    await user.type(emailInput, 'test@example.com');
    await user.keyboard('{Enter}');

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should submit form with member emails', async () => {
    const user = userEvent.setup();

    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const nameInput = screen.getByLabelText('Group Name *');
    const emailInput = screen.getByPlaceholderText('Enter email address');
    const addButton = screen.getByText('Add');

    await user.type(nameInput, 'Test Group');
    await user.type(emailInput, 'test@example.com');
    await user.click(addButton);

    const submitButton = screen.getByRole('button', { name: 'Create Group' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Group',
        description: undefined,
        memberEmails: ['test@example.com'],
      });
    });
  });

  it('should submit form without member emails when none are added', async () => {
    const user = userEvent.setup();

    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const nameInput = screen.getByLabelText('Group Name *');

    await user.type(nameInput, 'Test Group');

    const submitButton = screen.getByRole('button', { name: 'Create Group' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Group',
        description: undefined,
        memberEmails: undefined,
      });
    });
  });

  it('should show invited members section when members are added', async () => {
    const user = userEvent.setup();

    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    // Initially should not show invited members section
    expect(screen.queryByText('Invited Members:')).not.toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText('Enter email address');
    const addButton = screen.getByText('Add');

    await user.type(emailInput, 'test@example.com');
    await user.click(addButton);

    // Should now show invited members section
    expect(screen.getByText('Invited Members:')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should disable add button when email input is empty', () => {
    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const addButton = screen.getByText('Add');
    expect(addButton).toBeDisabled();
  });

  it('should enable add button when valid email is entered', async () => {
    const user = userEvent.setup();

    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const emailInput = screen.getByPlaceholderText('Enter email address');
    const addButton = screen.getByText('Add');

    expect(addButton).toBeDisabled();

    await user.type(emailInput, 'test@example.com');

    expect(addButton).not.toBeDisabled();
  });

  it('should clear email errors when user starts typing', async () => {
    const user = userEvent.setup();

    render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const emailInput = screen.getByPlaceholderText('Enter email address');
    const addButton = screen.getByText('Add');

    // Try to add invalid email
    await user.type(emailInput, 'invalid');
    await user.click(addButton);

    expect(
      screen.getByText('Please enter a valid email address')
    ).toBeInTheDocument();

    // Start typing valid email
    await user.clear(emailInput);
    await user.type(emailInput, 'test@example.com');

    // Error should be cleared
    expect(
      screen.queryByText('Please enter a valid email address')
    ).not.toBeInTheDocument();
  });

  it('should reset member emails when form is closed', async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const emailInput = screen.getByPlaceholderText('Enter email address');
    const addButton = screen.getByText('Add');

    // Add email
    await user.type(emailInput, 'test@example.com');
    await user.click(addButton);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();

    // Close form
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    // Re-open form
    rerender(
      <CreateGroupForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    // Member emails should be reset
    expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('Invited Members:')).not.toBeInTheDocument();
  });
});
