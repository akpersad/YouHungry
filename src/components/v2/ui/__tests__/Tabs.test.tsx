import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from '../Tabs';

const tabs = [
  { id: 'spin', label: 'Spin', content: <p>Spin content</p> },
  { id: 'vote', label: 'Vote', content: <p>Vote content</p> },
  { id: 'history', label: 'History', content: <p>History content</p> },
];

describe('v2 Tabs', () => {
  it('renders a tablist with the first tab selected', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Spin' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByText('Spin content')).toBeVisible();
    expect(screen.getByText('Vote content')).not.toBeVisible();
  });

  it('click selects a tab and swaps panels', () => {
    const onChange = jest.fn();
    render(<Tabs tabs={tabs} onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Vote' }));
    expect(onChange).toHaveBeenCalledWith('vote');
    expect(screen.getByRole('tab', { name: 'Vote' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByText('Vote content')).toBeVisible();
    expect(screen.getByText('Spin content')).not.toBeVisible();
  });

  it('arrow keys move selection with wrap; Home/End jump', () => {
    render(<Tabs tabs={tabs} />);
    const tablist = screen.getByRole('tablist');

    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Vote' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    fireEvent.keyDown(tablist, { key: 'ArrowLeft' });
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: 'History' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    fireEvent.keyDown(tablist, { key: 'Home' });
    expect(screen.getByRole('tab', { name: 'Spin' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    fireEvent.keyDown(tablist, { key: 'End' });
    expect(screen.getByRole('tab', { name: 'History' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('only the selected tab is in the tab order (roving tabindex)', () => {
    render(<Tabs tabs={tabs} defaultTab="vote" />);
    expect(screen.getByRole('tab', { name: 'Vote' })).toHaveAttribute(
      'tabindex',
      '0'
    );
    expect(screen.getByRole('tab', { name: 'Spin' })).toHaveAttribute(
      'tabindex',
      '-1'
    );
  });
});
