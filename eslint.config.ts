import js from '@eslint/js';
import type { Linter } from 'eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier/flat';
import boundaries from 'eslint-plugin-boundaries';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import storybook from 'eslint-plugin-storybook';
import tseslint from 'typescript-eslint';

// The module graph from src/modules/README.md; eslint.config.test.ts checks it has no cycles.
export const MODULE_DEPENDENCIES: Record<string, readonly string[]> = {
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

// theme.css sizes icons, so these props would lose to it or skip the tokens
const NO_ICON_SIZE_PROPS = {
  selector:
    'JSXOpeningElement[name.name=/Icon$/] > JSXAttribute[name.name=/^(size|width|height|color)$/]',
  message:
    'Size and colour an icon with classes, like text: `size-5`, `text-primary`.',
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
  globalIgnores([
    '.private/',
    'coverage/',
    '.vitest/',
    'test-results/',
    'playwright-report/',
    'blob-report/',
  ]),
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
    rules: {
      ...jsxA11y.flatConfigs.strict.rules,
      // A <label> around one of the src/ui fields labels it, like one around an <input>
      'jsx-a11y/label-has-associated-control': [
        'error',
        { controlComponents: ['Input', 'Textarea'] },
      ],
    },
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
      // Vitest and Playwright fixtures take `{}` when they need no other fixture
      'no-empty-pattern': ['error', { allowObjectPatternsAsParameters: true }],
      'no-restricted-syntax': ['error', NO_ENUMS, NO_ICON_SIZE_PROPS],
    },
  },
  {
    // Declaration merging, the one place that needs an interface
    files: ['**/*.d.ts'],
    rules: { '@typescript-eslint/consistent-type-definitions': 'off' },
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
  // A plain flat config at runtime, but its types turn each entry's missing keys into `key?: undefined`, which
  // exactOptionalPropertyTypes rejects
  storybook.configs['flat/recommended'] as unknown as Linter.Config[],
  {
    // A story's meta has to be the default export, and its text is sample data that users never see
    files: ['src/**/*.stories.tsx'],
    rules: {
      'import/no-default-export': 'off',
      'react/jsx-no-literals': 'off',
    },
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
    files: ['src/**'],
    ignores: ['src/ui/icons.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['lucide-react', 'lucide-react/*'],
              message: 'Import icons from `@/ui/icons`.',
            },
          ],
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
    // Tests are never imported by app code, so they need no `server-only` mark
    files: ['src/modules/*/domain/**/*.test.ts'],
    rules: {
      'no-restricted-syntax': ['error', NO_ENUMS, ...NO_CURRENT_TIME],
    },
  },
  {
    files: ['src/server/**', 'src/modules/*/{api,loaders,mcp}.ts'],
    ignores: [
      'src/server/**/*.test.ts',
      // drizzle-kit loads the schema in plain Node, where `server-only` throws
      'src/server/db/schema/**',
    ],
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
