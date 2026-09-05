import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { execSync } from 'node:child_process';

function countEmDashes(): number {
	try {
		const result = execSync(
			"grep -r '—' src --include='*.svelte' --include='*.ts' -o | wc -l",
			{ cwd: import.meta.dirname, encoding: 'utf-8' }
		);
		return parseInt(result.trim(), 10) || 0;
	} catch {
		return 0;
	}
}

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	define: {
		__EM_DASH_COUNT__: JSON.stringify(countEmDashes())
	},
	test: {
		include: ['src/**/*.test.ts']
	}
});
