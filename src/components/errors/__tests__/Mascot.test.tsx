/**
 * Mascot Component Tests
 */

import { render } from '@testing-library/react';
import { Mascot } from '../Mascot';

describe('Mascot', () => {
  it('should render without crashing', () => {
    const { container } = render(<Mascot />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should render different poses', () => {
    const poses: Array<
      'confused' | 'searching' | 'sad' | 'thinking' | 'waving'
    > = ['confused', 'searching', 'sad', 'thinking', 'waving'];

    poses.forEach((pose) => {
      const { container } = render(<Mascot pose={pose} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.querySelector(`#${pose}`)).toBeInTheDocument();
    });
  });

  it('should apply custom size', () => {
    const { container } = render(<Mascot size={300} />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('width', '300');
    expect(svg).toHaveAttribute('height', '300');
  });

  it('should apply custom className', () => {
    const { container } = render(<Mascot className="custom-class" />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveClass('custom-class');
  });

  it('should default to confused pose', () => {
    const { container } = render(<Mascot />);
    const svg = container.querySelector('svg');

    expect(svg?.querySelector('#confused')).toBeInTheDocument();
  });
});
