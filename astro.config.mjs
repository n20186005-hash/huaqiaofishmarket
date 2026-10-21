import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// 正式網域唯一設定點；尚未確定時維持空字串即可正常建置（可用 SITE_URL 覆寫）。
const SITE = process.env.SITE_URL || 'https://huaqiaofishmarket.com';

export default defineConfig({
  site: SITE || undefined,
  output: 'static',
  integrations: SITE ? [sitemap({ filter: (page) => !page.endsWith('/404.html') })] : [],
  vite: {
    plugins: [tailwindcss()],
  },
});
