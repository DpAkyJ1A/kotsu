declare module 'vitest' {
  // What vitest.db-setup.ts provides to the tests
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

// A module, so the block above extends Vitest's types instead of replacing them
export {};
