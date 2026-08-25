import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// 正式網域唯一設定點；尚未確定時維持空字串即可正常建置。
const SITE = '';

export default defineConfig({
  site: SITE || undefined,
  output: 'static',
  integrations: SITE ? [sitemap()] : [],
  vite: {
    plugins: [tailwindcss()],
  },
});
