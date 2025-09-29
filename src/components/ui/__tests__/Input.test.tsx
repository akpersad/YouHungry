import React from 'react';
import { render, screen } from '@testing-library/react';
import { Input } from '../Input';

describe('Input', () => {
  it('should render input field', () => {
    render(<Input placeholder="Test input" />);
    expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument();
  });

  it('should render error message when error prop is provided', () => {
    render(<Input error="Test error message" />);
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should apply error styling when error prop is provided', () => {
    render(<Input error="Test error message" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-error');
  });

  it('should render label when label prop is provided', () => {
    render(<Input label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('should render helper text when helperText prop is provided', () => {
    render(<Input helperText="Test helper text" />);
    expect(screen.getByText('Test helper text')).toBeInTheDocument();
  });

  it('should not render helper text when error is provided', () => {
    render(<Input error="Test error" helperText="Test helper text" />);
    expect(screen.queryByText('Test helper text')).not.toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });
});
