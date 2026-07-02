import { render, screen } from '@testing-library/react';

// The four test/debug pages must render inside AdminGate so they are not
// reachable by regular users (notification-test can trigger real SMS sends).
// AdminGate is mocked to a marker that does NOT render children, so the page
// internals (hooks, fetches) never execute.
jest.mock('@/components/admin/AdminGate', () => ({
  AdminGate: () => <div data-testid="admin-gate" />,
}));

import NotificationTestPage from '@/app/notification-test/page';
import PushTestPage from '@/app/push-test/page';
import DesignSystemPOC from '@/app/design-system-poc/page';
import PWAExplorerPage from '@/app/pwa-explorer/page';

describe('admin-gated test pages', () => {
  it.each([
    ['notification-test', NotificationTestPage],
    ['push-test', PushTestPage],
    ['design-system-poc', DesignSystemPOC],
    ['pwa-explorer', PWAExplorerPage],
  ])('/%s is wrapped in AdminGate', (_name, Page) => {
    render(<Page />);
    expect(screen.getByTestId('admin-gate')).toBeInTheDocument();
  });
});
