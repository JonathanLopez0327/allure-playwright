import { test, expect } from '@playwright/test';
import * as allure from "allure-js-commons";
import { Status } from "allure-js-commons";

test.beforeEach(async ({ page }) => {
  await allure.step("Navigate to TodoMVC App", async () => {
    await page.goto('https://demo.playwright.dev/todomvc');
  });
});

const TODO_ITEMS = [
  'buy some cheese',
  'feed the cat',
  'book a doctor’s appointment'
];

test.describe('New Todo', () => {
  test('should allow me to add todo items', async ({ page }) => {
    await allure.step("Create a new todo locator", async () => {
      const newTodo = page.getByPlaceholder('What needs to be done?');

      await allure.step(`Create first todo: ${TODO_ITEMS[0]}`, async () => {
        await newTodo.fill(TODO_ITEMS[0]);
        await newTodo.press('Enter');
      });

      await allure.step("Verify first todo is added", async () => {
        await expect(page.getByTestId('todo-title')).toHaveText([TODO_ITEMS[0]]);
      });

      await allure.step(`Create second todo: ${TODO_ITEMS[1]}`, async () => {
        await newTodo.fill(TODO_ITEMS[1]);
        await newTodo.press('Enter');
      });

      await allure.step("Attach screenshot after adding todos", async () => {
        const screenshotPath = await page.screenshot({ path: 'allure-results/screenshot.png' });
        test.info().attach('Screenshot', { path: screenshotPath, contentType: 'image/png' });
      });

      await allure.step("Verify both todos are present", async () => {
        await expect(page.getByTestId('todo-title')).toHaveText([TODO_ITEMS[0], TODO_ITEMS[1]]);
      });

      await allure.step("Check number of todos in local storage", async () => {
        await checkNumberOfTodosInLocalStorage(page, 2);
      });
    });
  });

  test('should clear text input field when an item is added', async ({ page }) => {
    await allure.step("Create a new todo locator", async () => {
      const newTodo = page.getByPlaceholder('What needs to be done?');

      await allure.step(`Create todo: ${TODO_ITEMS[0]}`, async () => {
        await newTodo.fill(TODO_ITEMS[0]);
        await newTodo.press('Enter');
      });

      await allure.step("Verify input is cleared", async () => {
        await expect(newTodo).toBeEmpty();
      });

      await allure.step("Check number of todos in local storage", async () => {
        await checkNumberOfTodosInLocalStorage(page, 1);
      });
    });
  });
});

test.describe('Mark all as completed', () => {
  test.beforeEach(async ({ page }) => {
    await allure.step("Create default todos", async () => {
      await createDefaultTodos(page);
    });

    await allure.step("Verify local storage count is 3", async () => {
      await checkNumberOfTodosInLocalStorage(page, 3);
    });
  });

  test('should allow me to mark all items as completed', async ({ page }) => {
    await allure.step("Mark all as completed", async () => {
      await page.getByLabel('Mark all as complete').check();
    });

    await allure.step("Verify all todos have 'completed' class", async () => {
      await expect(page.getByTestId('todo-item')).toHaveClass(['completed', 'completed', 'completed']);
    });

    await allure.step("Check completed todos in local storage", async () => {
      await checkNumberOfCompletedTodosInLocalStorage(page, 3);
    });
  });
});

test.describe('Item', () => {
  test('should allow me to mark items as complete', async ({ page }) => {
    await allure.step("Create a new todo locator", async () => {
      const newTodo = page.getByPlaceholder('What needs to be done?');

      await allure.step("Create two items", async () => {
        for (const item of TODO_ITEMS.slice(0, 2)) {
          await newTodo.fill(item);
          await newTodo.press('Enter');
        }
      });

      await allure.step("Mark first todo as completed", async () => {
        const firstTodo = page.getByTestId('todo-item').nth(0);
        await firstTodo.getByRole('checkbox').check();
        await expect(firstTodo).toHaveClass('completed');
      });

      await allure.step("Mark second todo as completed", async () => {
        const secondTodo = page.getByTestId('todo-item').nth(1);
        await secondTodo.getByRole('checkbox').check();
        await expect(secondTodo).toHaveClass('completed');
      });
    });
  });

  test('should allow me to edit an item', async ({ page }) => {
    await allure.step("Create default todos", async () => {
      await createDefaultTodos(page);
    });

    await allure.step("Edit the second todo", async () => {
      const todoItems = page.getByTestId('todo-item');
      const secondTodo = todoItems.nth(1);

      await secondTodo.dblclick();
      await expect(secondTodo.getByRole('textbox', { name: 'Edit' })).toHaveValue(TODO_ITEMS[1]);

      await allure.step("Change the text", async () => {
        await secondTodo.getByRole('textbox', { name: 'Edit' }).fill('buy some sausages');
        await secondTodo.getByRole('textbox', { name: 'Edit' }).press('Enter');
      });

      await allure.step("Verify the updated text", async () => {
        await expect(todoItems).toHaveText([TODO_ITEMS[0], 'buy some sausages', TODO_ITEMS[2]]);
      });

      await allure.step("Check local storage", async () => {
        await checkTodosInLocalStorage(page, 'buy some sausages');
      });
    });
  });
});

// Utility functions with Allure Steps
async function createDefaultTodos(page) {
  await allure.step("Create default todos", async () => {
    const newTodo = page.getByPlaceholder('What needs to be done?');

    for (const item of TODO_ITEMS) {
      await allure.step(`Add todo: ${item}`, async () => {
        await newTodo.fill(item);
        await newTodo.press('Enter');
      });
    }
  });
}

async function checkNumberOfTodosInLocalStorage(page, expected) {
  await allure.step(`Check number of todos in local storage: ${expected}`, async () => {
    return await page.waitForFunction(e => {
      return JSON.parse(localStorage['react-todos']).length === e;
    }, expected);
  });
}

async function checkNumberOfCompletedTodosInLocalStorage(page, expected) {
  await allure.step(`Check number of completed todos in local storage: ${expected}`, async () => {
    return await page.waitForFunction(e => {
      return JSON.parse(localStorage['react-todos']).filter(i => i.completed).length === e;
    }, expected);
  });
}

async function checkTodosInLocalStorage(page, title) {
  await allure.step(`Check if '${title}' is in local storage`, async () => {
    return await page.waitForFunction(t => {
      return JSON.parse(localStorage['react-todos']).map(i => i.title).includes(t);
    }, title);
  });
}