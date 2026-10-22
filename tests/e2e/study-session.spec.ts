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

test.describe("blank table", () => {
  test("reveals one element at a time", async ({ page }) => {
    await page.goto("/blank-table");
    const table = page.getByRole("group", { name: "Blank periodic table" });
    await expect(table.getByRole("button")).toHaveCount(118);
    await expect(page.getByTestId("blank-26")).toHaveText("26");

    await page.getByTestId("blank-26").click();
    await expect(page.getByTestId("revealed-name")).toHaveText("Iron");
    await expect(page.getByTestId("blank-26")).toHaveAttribute("aria-pressed", "true");

    await page.getByTestId("blank-79").click();
    await expect(page.getByTestId("revealed-name")).toHaveText("Gold");
    await expect(page.getByTestId("blank-26")).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByTestId("blank-26")).toHaveText("26");

    await page.getByTestId("blank-79").click();
    await expect(page.getByTestId("revealed-name")).toHaveCount(0);
  });

  test("number mode quizzes from the number alone and keeps its place across modes", async ({ page }) => {
    await page.goto("/blank-table");
    await page.getByRole("tab", { name: "Number" }).click();
    await expect(page.getByRole("group", { name: "Blank periodic table" })).toHaveCount(0);
    await expect(page.getByTestId("drill-position")).toHaveText("1 of 118");

    const number = Number(await page.getByTestId("drill-number").textContent());
    expect(number).toBeGreaterThanOrEqual(1);
    expect(number).toBeLessThanOrEqual(118);
    await expect(page.getByTestId("drill-answer")).toHaveCount(0);

    await page.getByRole("button", { name: "Reveal" }).click();
    await expect(page.getByTestId("drill-answer")).not.toBeEmpty();
    await page.getByRole("button", { name: "Next number" }).click();
    await expect(page.getByTestId("drill-position")).toHaveText("2 of 118");
    await expect(page.getByTestId("drill-answer")).toHaveCount(0);

    await page.getByRole("tab", { name: "Table" }).click();
    await expect(page.getByTestId("blank-1")).toBeVisible();
    await page.getByRole("tab", { name: "Number" }).click();
    await expect(page.getByTestId("drill-position")).toHaveText("2 of 118");
  });

  test("number mode can be limited to a maximum atomic number, and remembers it", async ({ page }) => {
    await page.goto("/blank-table");
    await page.getByRole("tab", { name: "Number" }).click();
    const limit = page.getByLabel("Highest atomic number to practice");
    await limit.fill("12");
    await limit.press("Enter");
    await expect(page.getByTestId("drill-position")).toHaveText("1 of 12");

    for (let i = 0; i < 12; i++) {
      expect(Number(await page.getByTestId("drill-number").textContent())).toBeLessThanOrEqual(12);
      await page.getByRole("button", { name: "Reveal" }).click();
      await page.getByRole("button", { name: "Next number" }).click();
    }
    await expect(page.getByTestId("drill-position")).toHaveText("1 of 12 · round 2");

    await page.reload();
    await page.getByRole("tab", { name: "Number" }).click();
    await expect(limit).toHaveValue("12");
    await expect(page.getByTestId("drill-position")).toHaveText("1 of 12");
  });
});
