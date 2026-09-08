import { expect, test } from '@playwright/test';

const API_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3001';

test.describe('Backend – godkänt nivå', () => {
  test('användaren kan skapas, logga in, se sitt saldo och sätta in pengar', async ({
    request,
  }) => {
    const username = `student-${Date.now()}`;
    const password = 'hemligt123';

    const createUserResponse = await request.post(`${API_URL}/users`, {
      data: { username, password },
    });

    expect(createUserResponse.ok(), 'POST /users ska svara med en 2xx-status').toBe(
      true,
    );

    const loginResponse = await request.post(`${API_URL}/sessions`, {
      data: { username, password },
    });

    expect(
      loginResponse.ok(),
      'POST /sessions ska svara med en 2xx-status för rätt inloggning',
    ).toBe(true);

    const loginBody = await loginResponse.json();
    expect(loginBody).toEqual(
      expect.objectContaining({
        token: expect.stringMatching(/^\d{6}$/),
      }),
    );

    const { token } = loginBody;
    const initialAccountResponse = await request.post(`${API_URL}/me/accounts`, {
      data: { token },
    });

    expect(
      initialAccountResponse.ok(),
      'POST /me/accounts ska godkänna användarens token',
    ).toBe(true);
    const initialAccountBody = await initialAccountResponse.json();
    expect(initialAccountBody).toEqual(expect.objectContaining({ amount: 0 }));

    const transactionResponse = await request.post(
      `${API_URL}/me/accounts/transactions`,
      {
        data: { token, amount: 250 },
      },
    );

    expect(
      transactionResponse.ok(),
      'POST /me/accounts/transactions ska svara med en 2xx-status',
    ).toBe(true);
    const transactionBody = await transactionResponse.json();
    expect(transactionBody).toEqual(expect.objectContaining({ amount: 250 }));

    const updatedAccountResponse = await request.post(`${API_URL}/me/accounts`, {
      data: { token },
    });

    expect(updatedAccountResponse.ok()).toBe(true);
    const updatedAccountBody = await updatedAccountResponse.json();
    expect(updatedAccountBody).toEqual(expect.objectContaining({ amount: 250 }));
  });

  test('kontouppgifter skyddas av ett giltigt engångslösenord', async ({
    request,
  }) => {
    const response = await request.post(`${API_URL}/me/accounts`, {
      data: { token: '000000' },
    });

    expect(
      [401, 403],
      'En ogiltig token ska ge status 401 eller 403',
    ).toContain(response.status());
  });
});
