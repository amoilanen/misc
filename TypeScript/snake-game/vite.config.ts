import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.ts'],
		deps: {
			optimizer: {
				web: {
					include: ['svelte']
				}
			}
		},
		alias: {
			'$lib': './src/lib'
		}
	}
});
