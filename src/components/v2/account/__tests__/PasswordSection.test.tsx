import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordSection } from '../PasswordSection';

function jsonResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
});

async function openAndFill() {
  await userEvent.click(
    screen.getByRole('button', { name: 'Change password' })
  );
  await userEvent.type(screen.getByLabelText(/current password/i), 'old-pass');
  await userEvent.type(screen.getByLabelText(/new password/i), 'new-pass-123');
  await userEvent.click(
    screen.getByRole('button', { name: 'Update password' })
  );
}

describe('PasswordSection', () => {
  it('is collapsed until asked', () => {
    render(<PasswordSection />);
    expect(
      screen.queryByLabelText(/current password/i)
    ).not.toBeInTheDocument();
  });

  it('posts both passwords and collapses on success', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => jsonResponse({}));
    render(<PasswordSection />);

    await openAndFill();

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Password updated. Other devices are signed out.'
    );
    expect(
      screen.queryByLabelText(/current password/i)
    ).not.toBeInTheDocument();
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/v2/account/password');
    expect(JSON.parse(init.body)).toEqual({
      currentPassword: 'old-pass',
      newPassword: 'new-pass-123',
    });
  });

  it('keeps the form open and shows the server message on rejection', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      jsonResponse({ error: 'That current password is not right.' }, false, 400)
    );
    render(<PasswordSection />);

    await openAndFill();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That current password is not right.'
    );
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
  });

  it('uses generic copy when the failure carries no message', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      jsonResponse({}, false, 500)
    );
    render(<PasswordSection />);

    await openAndFill();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not update your password. Try again.'
    );
  });

  it('backs out with Never mind and forgets what was typed', async () => {
    render(<PasswordSection />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Change password' })
    );
    await userEvent.type(screen.getByLabelText(/current password/i), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Never mind' }));
    expect(
      screen.queryByLabelText(/current password/i)
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Change password' })
    );
    expect(screen.getByLabelText(/current password/i)).toHaveValue('');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
