import { render, screen } from '@testing-library/react';
import { RestaurantImage } from '../RestaurantImage';

describe('RestaurantImage', () => {
  it('should show fallback icon when no src provided', () => {
    render(<RestaurantImage alt="Test Restaurant" />);
    expect(screen.getByText('🍽️')).toBeInTheDocument();
  });

  it('should show cuisine-specific icon when cuisine provided', () => {
    render(<RestaurantImage alt="Italian Restaurant" cuisine="Italian" />);
    expect(screen.getByText('🍕')).toBeInTheDocument();
  });

  it('should show custom fallback icon when provided', () => {
    render(<RestaurantImage alt="Test Restaurant" fallbackIcon="🍔" />);
    expect(screen.getByText('🍔')).toBeInTheDocument();
  });

  it('should show image when src is valid', () => {
    render(
      <RestaurantImage
        src="https://example.com/image.jpg"
        alt="Test Restaurant"
      />
    );
    const img = screen.getByAltText('Test Restaurant');
    expect(img).toBeInTheDocument();
    // Next.js Image component transforms the src URL, so we check for the pattern
    expect(img).toHaveAttribute(
      'src',
      expect.stringContaining('https://example.com/image.jpg')
    );
  });

  it('should show different icons for different cuisines', () => {
    const { rerender } = render(
      <RestaurantImage alt="Chinese" cuisine="Chinese" />
    );
    expect(screen.getByText('🥢')).toBeInTheDocument();

    rerender(<RestaurantImage alt="Mexican" cuisine="Mexican" />);
    expect(screen.getByText('🌮')).toBeInTheDocument();

    rerender(<RestaurantImage alt="Japanese" cuisine="Japanese" />);
    expect(screen.getByText('🍣')).toBeInTheDocument();

    rerender(<RestaurantImage alt="Indian" cuisine="Indian" />);
    expect(screen.getByText('🍛')).toBeInTheDocument();
  });
});
