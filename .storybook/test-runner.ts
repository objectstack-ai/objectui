import type { TestRunnerConfig } from '@storybook/test-runner';

const config: TestRunnerConfig = {
  // Hook that is executed before the test runner starts running tests
  async preVisit(page) {
    // Set up any global variables or configurations needed for tests
    await page.evaluate(() => {
      // Define __test global if it's being referenced by test infrastructure
      (window as any).__test = true;
    });
  },
};

export default config;
