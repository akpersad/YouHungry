import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CityStateInput } from '../CityStateInput';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('CityStateInput', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    onCityStateChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders input field with placeholder', () => {
    render(
      <CityStateInput {...defaultProps} placeholder="Search for a city..." />
    );

    const input = screen.getByPlaceholderText('Search for a city...');
    expect(input).toBeInTheDocument();
  });

  it('shows suggestions when typing', async () => {
    render(<CityStateInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Los' } });

    await waitFor(() => {
      expect(screen.getByText('Los Angeles')).toBeInTheDocument();
      expect(screen.getByText('California')).toBeInTheDocument();
    });
  });

  it('calls onCityStateChange when suggestion is selected', async () => {
    const onCityStateChange = jest.fn();
    render(
      <CityStateInput {...defaultProps} onCityStateChange={onCityStateChange} />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Los' } });

    await waitFor(() => {
      expect(screen.getByText('Los Angeles')).toBeInTheDocument();
    });

    // Click on the suggestion container (not the text)
    const suggestion = screen
      .getByText('Los Angeles')
      .closest('div[class*="cursor-pointer"]');
    fireEvent.click(suggestion!);

    expect(onCityStateChange).toHaveBeenCalledWith(
      'Los Angeles',
      'California',
      'CA'
    );
  });

  it('handles keyboard navigation', async () => {
    render(<CityStateInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Los' } });

    await waitFor(() => {
      expect(screen.getByText('Los Angeles')).toBeInTheDocument();
    });

    // Test arrow down
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const suggestion = screen
      .getByText('Los Angeles')
      .closest('div[class*="cursor-pointer"]');
    expect(suggestion).toHaveClass('bg-blue-50');

    // Test enter
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(defaultProps.onChange).toHaveBeenCalledWith(
      'Los Angeles, California'
    );
  });

  it('handles empty input gracefully', async () => {
    render(<CityStateInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '' } });

    // Should not show suggestions for empty input
    expect(screen.queryByText('Los Angeles')).not.toBeInTheDocument();
  });
});
