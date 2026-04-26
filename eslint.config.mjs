import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig(
	[
		...nextVitals,
		...nextTs,
		// Override default ignores of eslint-config-next.
		globalIgnores([
			// Default ignores of eslint-config-next:
			".next/**",
			"out/**",
			"build/**",
			"next-env.d.ts",
		]),
	],
	{
		rules: {
			"no-console": "off",
			"no-debugger": "off",
			"no-duplicate-imports": "error",
			"@typescript-eslint/consistent-type-imports": [
				"error",
				{
					prefer: "type-imports",
					fixStyle: "inline-type-imports",
					disallowTypeAnnotations: false,
				},
			],
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": "off",
			"@typescript-eslint/no-unused-expressions": "off",
		},
	},
);

export default eslintConfig;
