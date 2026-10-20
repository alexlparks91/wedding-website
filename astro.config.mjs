// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://wedding.example.com',
	integrations: [
		react(),
		sitemap({
			filter: (page) => !page.includes('/drafts/'),
		}),
	],
});
