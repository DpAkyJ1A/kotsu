import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier/flat';
import boundaries from 'eslint-plugin-boundaries';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

// The module graph from src/modules/README.md; it must stay acyclic.
const MODULE_DEPENDENCIES: Record<string, readonly string[]> = {
  account: [],
  shelves: [],
  cards: [],
  docs: ['shelves', 'cards'],
  sheets: ['shelves'],
  calendar: [],
  practice: ['cards', 'calendar'],
  search: [],
  onboarding: [
    'account',
    'shelves',
    'cards',
    'docs',
    'sheets',
    'calendar',
    'practice',
  ],
  clock: [],
};

const MODULE_FOLDERS = ['core', 'domain', 'ui', 'hooks'];
const SHARED_FOLDERS = ['ui', 'lib', 'server', 'i18n'];

// Selectors for the boundaries/dependencies policies
const SAME_MODULE = '{{from.element.captured.module}}';
const element = (...types: string[]) => ({ element: { type: types } });
const ownModule = (...types: string[]) => ({
  element: { type: types, captured: { module: SAME_MODULE } },
});
const inModule = (module: string, ...types: string[]) => ({
  element: { type: types, captured: { module } },
});
const door = (files: string[], captured?: Record<string, string>) => ({
  element: {
    type: 'module',
    fileInternalPath: files,
    ...(captured ? { captured } : {}),
  },
});
const allow = (from: object, ...to: object[]) => ({ from, allow: { to } });

const NO_ENUMS = {
  selector: 'TSEnumDeclaration',
  message: 'Use a string union or an `as const` object instead of an enum.',
};

const NO_CURRENT_TIME = [
  {
    selector: "NewExpression[callee.name='Date'][arguments.length=0]",
    message: 'Take the current time from `ctx.now` or a parameter.',
  },
  {
    selector:
      "CallExpression[callee.object.name='Date'][callee.property.name='now']",
    message: 'Take the current time from `ctx.now` or a parameter.',
  },
];

const SERVER_ONLY = {
  selector: "Program:not(:has(ImportDeclaration[source.value='server-only']))",
  message: "Server-only file: start it with `import 'server-only'`.",
};

export default defineConfig([
  globalIgnores(['.private/', 'coverage/']),
  js.configs.recommended,
  ...nextVitals,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // eslint-config-next registers the jsx-a11y plugin but turns on only six of its rules
    rules: { ...jsxA11y.flatConfigs.strict.rules },
  },
  {
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  {
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      'no-restricted-syntax': ['error', NO_ENUMS],
    },
  },
  {
    files: ['src/**'],
    ignores: ['src/app/**'],
    rules: { 'import/no-default-export': 'error' },
  },
  {
    files: ['src/**/*.tsx'],
    rules: { 'react/jsx-no-literals': 'error' },
  },
  {
    files: ['src/**'],
    ignores: ['src/server/env.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message: 'Read environment variables through src/server/env.ts.',
        },
      ],
    },
  },
  {
    files: ['src/modules/*/core/**'],
    rules: {
      'no-restricted-syntax': ['error', NO_ENUMS, ...NO_CURRENT_TIME],
    },
  },
  {
    files: ['src/modules/*/domain/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        NO_ENUMS,
        ...NO_CURRENT_TIME,
        SERVER_ONLY,
      ],
    },
  },
  {
    files: ['src/server/**', 'src/modules/*/{api,loaders,mcp}.ts'],
    rules: { 'no-restricted-syntax': ['error', NO_ENUMS, SERVER_ONLY] },
  },
  {
    files: ['src/**'],
    plugins: { boundaries },
    settings: {
      'boundaries/legacy-templates': false,
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app' },
        ...MODULE_FOLDERS.map((folder) => ({
          type: `module-${folder}`,
          pattern: `src/modules/*/${folder}`,
          capture: ['module'],
        })),
        // The door files at a module's root
        { type: 'module', pattern: 'src/modules/*', capture: ['module'] },
        ...SHARED_FOLDERS.map((folder) => ({
          type: folder,
          pattern: `src/${folder}`,
        })),
      ].map((descriptor) => ({ ...descriptor, partialMatch: false })),
    },
    rules: {
      'boundaries/no-unknown-files': 'error',
      'boundaries/no-unknown-dependencies': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            allow(
              element('app'),
              element('app', ...SHARED_FOLDERS),
              door(['index.ts', 'actions.ts', 'loaders.ts', 'mcp.ts']),
            ),
            allow(
              door(['index.ts']),
              ownModule('module-core', 'module-ui', 'module-hooks'),
            ),
            allow(
              door(['api.ts', 'loaders.ts', 'mcp.ts']),
              ownModule('module-core', 'module-domain'),
              element('server', 'lib'),
            ),
            allow(
              door(['actions.ts']),
              ownModule('module-core', 'module-domain'),
              { element: { type: 'server', fileInternalPath: 'actions.ts' } },
            ),
            allow(
              element('module-core'),
              ownModule('module-core'),
              element('lib'),
            ),
            allow(
              element('module-domain'),
              ownModule('module-core', 'module-domain'),
              element('server', 'lib'),
            ),
            allow(
              element('module-ui', 'module-hooks'),
              ownModule('module-core', 'module-ui', 'module-hooks'),
              door(['actions.ts'], { module: SAME_MODULE }),
              element('ui', 'lib'),
            ),
            ...Object.entries(MODULE_DEPENDENCIES).flatMap(
              ([module, dependencies]) =>
                dependencies.flatMap((dependency) => [
                  allow(
                    inModule(module, 'module-domain'),
                    door(['api.ts'], { module: dependency }),
                  ),
                  allow(
                    inModule(module, 'module-ui', 'module-hooks'),
                    door(['index.ts'], { module: dependency }),
                  ),
                ]),
            ),
            allow(element('ui'), element('ui', 'lib')),
            allow(element('lib'), element('lib')),
            allow(element('server'), element('server', 'lib')),
            allow(element('i18n'), element('i18n', 'lib')),
          ],
        },
      ],
    },
  },
  prettier,
]);
