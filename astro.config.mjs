// @ts-check
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
	site: 'https://logs.ishanbagchi.com',
	markdown: {
		shikiConfig: {
			themes: {
				light: 'catppuccin-latte',
				dark: 'github-dark-dimmed',
			},
			defaultColor: false,
			wrap: false,
		},
	},
})
