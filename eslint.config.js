import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.venv', 'supabase', '.netlify']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // no-unused-vars false-positives:
      //   - `motion` / `AnimatePresence` are imported and used via JSX member
      //     expression (<motion.div>) but `react/jsx-uses-vars` is not loaded
      //     so they read as unused. Whitelist them explicitly.
      //   - `_` prefix on args / destructured / caught errors is convention
      //     for "intentionally unused" (e.g. `(_, { id }) => ...`).
      //   - `...rest` siblings should not flag the named keys.
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^(motion|AnimatePresence|[A-Z_])',
        // PascalCase args: components passed via prop/destructured rename
        // (e.g. `.map(({ icon: Icon }) => <Icon />)`) — JSX usage isn't tracked
        // by no-unused-vars, so allow without flagging.
        argsIgnorePattern: '^(_|[A-Z])',
        destructuredArrayIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],

      // Dev-tooling rule — files that export hooks alongside components
      // still build fine in prod, only HMR is affected. Downgrade to warn
      // so genuine refactor candidates are visible without blocking lint.
      'react-refresh/only-export-components': 'warn',

      // Common intentional pattern: useEffect that syncs async query data
      // back into local form state. Downgrade to warn — real bugs can still
      // be addressed individually, but the rule is overly strict by default.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  // Node config files (vite.config.js, etc.) need Node globals like __dirname.
  {
    files: ['*.config.js', 'scripts/**/*.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
])
