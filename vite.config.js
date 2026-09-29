import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/* <!--include:name--> → partials/name.html (shared chrome for every page) */
const partials = () => ({
  name: 'html-partials',
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      return html.replace(/<!--include:([\w-]+)-->/g, (_, name) =>
        readFileSync(resolve(__dirname, 'partials', `${name}.html`), 'utf8'));
    },
  },
  handleHotUpdate({ file, server }) {
    if (file.includes('partials')) server.ws.send({ type: 'full-reload' });
  },
});

export default defineConfig({
  plugins: [partials()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        services: resolve(__dirname, 'services.html'),
        contact: resolve(__dirname, 'contact.html'),
      },
    },
  },
});
