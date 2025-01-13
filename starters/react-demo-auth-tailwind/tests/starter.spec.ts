import { expect, test } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test("home page loads", async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.fillUsername("Alice");
  await loginPage.signup();

  await expect(page.getByText("Welcome!")).toBeVisible();

  await page.getByLabel("First name").fill("Bob");
  await expect(page.getByText("Welcome, Bob!")).toBeVisible();
});
