import tseslint from 'typescript-eslint'
import eslint from '@eslint/js'

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		rules: {
			// Allow unused vars prefixed with _
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{argsIgnorePattern: '^_', varsIgnorePattern: '^_'},
			],
			// Allow explicit any in a few places
			'@typescript-eslint/no-explicit-any': 'warn',
			// Allow non-null assertions — we use noUncheckedIndexedAccess
			'@typescript-eslint/no-non-null-assertion': 'off',
			// Allow empty functions (constructors, callbacks)
			'@typescript-eslint/no-empty-function': 'off',
			// Allow empty interfaces (base types)
			'@typescript-eslint/no-empty-object-type': 'off',
			// Prefer const where possible
			'prefer-const': 'error',
			// No console.log except warn/error
			'no-console': ['warn', {allow: ['warn', 'error']}],
		},
	},
	{
		ignores: ['dist/', 'node_modules/', '*.js', '*.mjs'],
	},
)
