import { expect, test, type Page } from "@playwright/test";

async function answerCard(page: Page, rating: "Again" | "Hard" | "Good" | "Easy") {
  await page.getByRole("button", { name: "Show answer" }).click();
  await expect(page.getByTestId("flashcard")).toHaveAttribute("data-revealed", "true");
  await page.getByRole("group", { name: "How well did you recall it?" }).getByRole("button", { name: new RegExp(`^${rating}`) }).click();
}

test.describe("study session", () => {
  test("completes a full learning session and keeps progress after reload", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Hydrogen to Neon" })).toBeVisible();
    await page.getByRole("button", { name: "Start learning" }).click();

    await expect(page).toHaveURL(/\/study$/);
    const counter = page.getByTestId("session-counter");
    await expect(counter).toHaveText("1 / 20");

    await answerCard(page, "Again");
    await expect(counter).toHaveText("2 / 21");

    while (!(await page.getByTestId("session-complete").isVisible())) {
      await answerCard(page, "Good");
    }

    const complete = page.getByTestId("session-complete");
    await expect(complete.getByText("Session complete")).toBeVisible();
    await expect(page.getByTestId("session-accuracy")).toHaveText("95%");

    await page.goto("/progress");
    await expect(page.getByTestId("session-history").getByText("Learning · Section 1")).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("session-history").getByRole("listitem")).toHaveCount(1);

    await page.goto("/");
    await expect(page.getByRole("button", { name: "Continue learning" })).toBeVisible();
    await expect(page.getByTestId("section-2")).toHaveAttribute("data-unlocked", "false");
  });

  test("supports keyboard reveal and rating", async ({ page, isMobile }) => {
    test.skip(isMobile, "Keyboard shortcuts are a desktop affordance");
    await page.goto("/study");
    await page.getByRole("button", { name: "Start section 1" }).click();
    await expect(page.getByTestId("session-counter")).toHaveText("1 / 20");
    await page.keyboard.press("Space");
    await expect(page.getByTestId("flashcard")).toHaveAttribute("data-revealed", "true");
    await page.keyboard.press("3");
    await expect(page.getByTestId("session-counter")).toHaveText("2 / 20");
  });

  test("resumes an unfinished session after a reload", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Start learning" }).click();
    await answerCard(page, "Good");
    await answerCard(page, "Easy");
    await expect(page.getByTestId("session-counter")).toHaveText("3 / 20");

    await page.reload();
    await expect(page.getByTestId("session-counter")).toHaveText("3 / 20");
  });
});

test.describe("periodic table", () => {
  test("shows all elements and opens element details", async ({ page }) => {
    await page.goto("/periodic-table");
    await expect(page.getByRole("group", { name: "Periodic table of elements" }).getByRole("button")).toHaveCount(118);

    await page.getByTestId("element-Fe").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Iron" })).toBeVisible();
    await expect(dialog.getByText("Transition metal").first()).toBeVisible();
    await expect(dialog.getByText("Locked")).toBeVisible();
  });
});
