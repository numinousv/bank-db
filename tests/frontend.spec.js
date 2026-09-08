import { expect, test } from '@playwright/test';

const createAccountText =
  /skapa (användare|konto)|registrera|create account|sign up/i;
const usernameText = /användarnamn|username/i;
const passwordText = /lösenord|password/i;

test.describe('Frontend – godkänt nivå', () => {
  test('landningssidan har navigation och en hero-länk till registrering', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /hem|home/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /logga in|login/i }).first()).toBeVisible();
    await expect(
      page.getByRole('link', { name: createAccountText }).first(),
    ).toBeVisible();

    const createAccountControls = page
      .getByRole('link', { name: createAccountText })
      .or(page.getByRole('button', { name: createAccountText }));

    await expect
      .poll(() => createAccountControls.count(), {
        message:
          'Det ska finnas både navigation och en hero-länk eller knapp för att skapa användare',
      })
      .toBeGreaterThanOrEqual(2);
  });

  test('användaren kan registrera sig, logga in och sätta in pengar', async ({
    page,
  }) => {
    const username = `webbstudent-${Date.now()}`;
    const password = 'hemligt123';

    await page.goto('/register');
    await page.getByLabel(usernameText).fill(username);
    await page.getByLabel(passwordText).fill(password);

    const createUserResponsePromise = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/users' &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: createAccountText }).click();

    const createUserResponse = await createUserResponsePromise;
    expect(
      createUserResponse.ok(),
      'Registreringsformuläret ska skicka POST /users',
    ).toBe(true);

    await page.goto('/login');
    await page.getByLabel(usernameText).fill(username);
    await page.getByLabel(passwordText).fill(password);

    const loginResponsePromise = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/sessions' &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /logga in|login/i }).click();

    const loginResponse = await loginResponsePromise;
    expect(loginResponse.ok(), 'Inloggningsformuläret ska skicka POST /sessions').toBe(
      true,
    );
    await expect(page).toHaveURL(/\/account\/?$/);

    await expect(page.getByText(/saldo|balance/i).first()).toBeVisible();
    await expect(page.getByText(/0\s*(kr|sek)/i).first()).toBeVisible();

    await page.getByLabel(/belopp|summa|amount/i).fill('250');
    const transactionResponsePromise = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/me/accounts/transactions' &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /sätt in|deposit/i }).click();

    const transactionResponse = await transactionResponsePromise;
    expect(
      transactionResponse.ok(),
      'Insättningsformuläret ska skicka POST /me/accounts/transactions',
    ).toBe(true);
    await expect(page.getByText(/250\s*(kr|sek)/i).first()).toBeVisible();
  });
});
