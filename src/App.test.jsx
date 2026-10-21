import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App.jsx';
import { KEYS } from './services/storage.js';

describe('first-run setup', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('allows someone to skip setup without creating a prediction date', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('heading', { name: /welcome to bloom/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Skip for now' }));

    expect(await screen.findByRole('heading', { name: /hey, sunshine/i })).toBeInTheDocument();
    expect(screen.getByText(/add one in settings/i)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(KEYS.settings))).toMatchObject({
      setupComplete: true,
      cycleLength: 29,
      periodDuration: 5,
      lastPeriodStart: null,
    });
  });

  it('saves provided cycle details before entering the app', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(screen.getByLabelText('Typical cycle length (days)'));
    await user.type(screen.getByLabelText('Typical cycle length (days)'), '32');
    await user.type(
      screen.getByLabelText('First day of your most recent period (optional)'),
      '2020-02-03',
    );
    await user.click(screen.getByRole('button', { name: 'Save and continue' }));

    expect(await screen.findByRole('heading', { name: /hey, sunshine/i })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(KEYS.settings))).toMatchObject({
      setupComplete: true,
      cycleLength: 32,
      periodDuration: 5,
      lastPeriodStart: '2020-02-03',
    });
  });
});