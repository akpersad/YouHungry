import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveToListDialog } from '../SaveToListDialog';

const PLACE_ID = 'c'.repeat(24);

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

function renderDialog(
  props: Partial<React.ComponentProps<typeof SaveToListDialog>> = {}
) {
  const onSaved = jest.fn();
  const onClose = jest.fn();
  render(
    <SaveToListDialog
      open
      placeId={PLACE_ID}
      placeName="Sushi Yama"
      onClose={onClose}
      onSaved={onSaved}
      {...props}
    />
  );
  return { onSaved, onClose };
}

describe('SaveToListDialog', () => {
  it('loads lists and saves to the tapped one, reporting the name', async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() =>
        jsonResponse({
          lists: [{ id: 'l1', name: 'Date night', placeCount: 3 }],
        })
      )
      .mockImplementationOnce(() =>
        jsonResponse({ list: { id: 'l1', name: 'Date night', placeCount: 4 } })
      );
    const { onSaved, onClose } = renderDialog();

    await userEvent.click(
      await screen.findByRole('button', { name: /date night/i })
    );

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Date night'));
    expect(onClose).toHaveBeenCalled();
    const [url, init] = (global.fetch as jest.Mock).mock.calls[1];
    expect(url).toBe('/api/v2/lists/l1/places');
    expect(JSON.parse(init.body)).toEqual({ placeId: PLACE_ID });
  });

  it('invites a first list when none exist, then creates and saves in one go', async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => jsonResponse({ lists: [] }))
      .mockImplementationOnce(() =>
        jsonResponse(
          { list: { id: 'new1', name: 'Lunch spots', placeCount: 0 } },
          true,
          201
        )
      )
      .mockImplementationOnce(() =>
        jsonResponse({
          list: { id: 'new1', name: 'Lunch spots', placeCount: 1 },
        })
      );
    const { onSaved } = renderDialog();

    expect(
      await screen.findByText(/name one and this spot starts it/i)
    ).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/new list/i), 'Lunch spots');
    await userEvent.click(screen.getByRole('button', { name: /start it/i }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Lunch spots'));
    const createCall = (global.fetch as jest.Mock).mock.calls[1];
    expect(createCall[0]).toBe('/api/v2/lists');
    expect(JSON.parse(createCall[1].body)).toEqual({ name: 'Lunch spots' });
  });

  it('requires a name before creating', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      jsonResponse({ lists: [] })
    );
    renderDialog();
    await screen.findByText(/name one and this spot starts it/i);

    await userEvent.click(screen.getByRole('button', { name: /start it/i }));

    expect(await screen.findByText('Give the list a name')).toBeInTheDocument();
    expect(global.fetch as jest.Mock).toHaveBeenCalledTimes(1);
  });

  it('surfaces the server message when a save is rejected', async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() =>
        jsonResponse({
          lists: [{ id: 'l1', name: 'Date night', placeCount: 200 }],
        })
      )
      .mockImplementationOnce(() =>
        jsonResponse(
          { error: 'That list is at 200 places. Start a fresh one.' },
          false,
          400
        )
      );
    const { onSaved } = renderDialog();

    await userEvent.click(
      await screen.findByRole('button', { name: /date night/i })
    );

    expect(
      await screen.findByText(/at 200 places\. Start a fresh one\./i)
    ).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });
});
