// @ts-check
import { defineConfig } from 'astro/config'

import mdx from '@astrojs/mdx'

import icon from 'astro-icon';

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

    integrations: [mdx(), icon()],
})