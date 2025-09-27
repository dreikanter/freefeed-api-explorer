import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/', // Serve from root path
  plugins: [sveltekit()],
});
