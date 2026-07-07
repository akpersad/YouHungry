import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useUser } from '@clerk/nextjs';
import { EmailSection } from '../EmailSection';

/** A Clerk email-address resource, as far as the component cares. */
function makeEmail(id: string, emailAddress: string) {
  return {
    id,
    emailAddress,
    prepareVerification: jest.fn(async () => undefined),
    attemptVerification: jest.fn(async () => undefined),
    destroy: jest.fn(async () => undefined),
  };
}

function makeUser(overrides: Record<string, unknown> = {}) {
  const oldEmail = makeEmail('em_old', 'old@example.com');
  const newEmail = makeEmail('em_new', 'new@example.com');
  const user = {
    emailAddresses: [oldEmail, newEmail],
    createEmailAddress: jest.fn(async () => newEmail),
    update: jest.fn(async () => undefined),
    ...overrides,
  };
  return { user, oldEmail, newEmail };
}

function mockUseUser(user: unknown, isLoaded = true) {
  (useUser as jest.Mock).mockReturnValue({ isLoaded, user });
}

beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
  (global.fetch as jest.Mock).mockImplementation(() =>
    Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
  );
});

async function startChange() {
  await userEvent.click(screen.getByRole('button', { name: 'Change email' }));
  await userEvent.type(screen.getByLabelText(/new email/i), 'new@example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Send the code' }));
}

describe('EmailSection', () => {
  it('shows the current email and opens the address step on demand', async () => {
    const { user } = makeUser();
    mockUseUser(user);
    render(<EmailSection initialEmail="old@example.com" />);

    expect(screen.getByText('old@example.com')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Change email' }));
    expect(screen.getByLabelText(/new email/i)).toBeInTheDocument();
  });

  it('walks add → verify → switch, destroying the old address', async () => {
    const { user, oldEmail, newEmail } = makeUser();
    mockUseUser(user);
    render(<EmailSection initialEmail="old@example.com" />);

    await startChange();
    expect(
      await screen.findByLabelText(/verification code/i)
    ).toBeInTheDocument();
    expect(user.createEmailAddress).toHaveBeenCalledWith({
      email: 'new@example.com',
    });
    expect(newEmail.prepareVerification).toHaveBeenCalledWith({
      strategy: 'email_code',
    });

    await userEvent.type(screen.getByLabelText(/verification code/i), '424242');
    await userEvent.click(
      screen.getByRole('button', { name: 'Verify and switch' })
    );

    expect(
      await screen.findByText('Email updated. Use it next time you sign in.')
    ).toBeInTheDocument();
    expect(newEmail.attemptVerification).toHaveBeenCalledWith({
      code: '424242',
    });
    expect(user.update).toHaveBeenCalledWith({
      primaryEmailAddressId: 'em_new',
    });
    expect(oldEmail.destroy).toHaveBeenCalled();
    expect(newEmail.destroy).not.toHaveBeenCalled();
    expect(screen.getByText('new@example.com')).toBeInTheDocument();
    // The Mongo mirror PATCH fired.
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v2/account',
        expect.objectContaining({ method: 'PATCH' })
      )
    );
  });

  it('surfaces the Clerk message when adding the address fails', async () => {
    const { user } = makeUser({
      createEmailAddress: jest.fn(async () => {
        throw { errors: [{ longMessage: 'That email address is taken.' }] };
      }),
    });
    mockUseUser(user);
    render(<EmailSection initialEmail="old@example.com" />);

    await startChange();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That email address is taken.'
    );
  });

  it('falls back to honest copy when the code does not verify', async () => {
    const { user, newEmail } = makeUser();
    newEmail.attemptVerification.mockRejectedValue(new Error('nope'));
    mockUseUser(user);
    render(<EmailSection initialEmail="old@example.com" />);

    await startChange();
    await userEvent.type(screen.getByLabelText(/verification code/i), '000000');
    await userEvent.click(
      screen.getByRole('button', { name: 'Verify and switch' })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That code did not verify. Try again.'
    );
  });

  it('restarts when the pending address has expired away', async () => {
    // createEmailAddress returns a resource Clerk no longer lists.
    const orphan = makeEmail('em_gone', 'new@example.com');
    const { user } = makeUser({
      createEmailAddress: jest.fn(async () => orphan),
    });
    mockUseUser(user);
    render(<EmailSection initialEmail="old@example.com" />);

    await startChange();
    await userEvent.type(screen.getByLabelText(/verification code/i), '424242');
    await userEvent.click(
      screen.getByRole('button', { name: 'Verify and switch' })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That change request expired. Start again.'
    );
    expect(screen.getByLabelText(/new email/i)).toBeInTheDocument();
  });

  it('backs out with Never mind', async () => {
    const { user } = makeUser();
    mockUseUser(user);
    render(<EmailSection initialEmail="old@example.com" />);

    await userEvent.click(screen.getByRole('button', { name: 'Change email' }));
    await userEvent.click(screen.getByRole('button', { name: 'Never mind' }));

    expect(screen.queryByLabelText(/new email/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Change email' })
    ).toBeInTheDocument();
  });
});
