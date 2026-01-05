import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_Ao_4qzma.mjs';
import { manifest } from './manifest_Dz8T_VWd.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/api/contact.astro.mjs');
const _page3 = () => import('./pages/blog/_slug_.astro.mjs');
const _page4 = () => import('./pages/blog.astro.mjs');
const _page5 = () => import('./pages/en/blog/_slug_.astro.mjs');
const _page6 = () => import('./pages/en/blog.astro.mjs');
const _page7 = () => import('./pages/en/thank-you-quote.astro.mjs');
const _page8 = () => import('./pages/en.astro.mjs');
const _page9 = () => import('./pages/gracias-cotizacion.astro.mjs');
const _page10 = () => import('./pages/sitemap.xml.astro.mjs');
const _page11 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/api/contact.js", _page2],
    ["src/pages/blog/[slug].astro", _page3],
    ["src/pages/blog.astro", _page4],
    ["src/pages/en/blog/[slug].astro", _page5],
    ["src/pages/en/blog.astro", _page6],
    ["src/pages/en/thank-you-quote.astro", _page7],
    ["src/pages/en/index.astro", _page8],
    ["src/pages/gracias-cotizacion.astro", _page9],
    ["src/pages/sitemap.xml.ts", _page10],
    ["src/pages/index.astro", _page11]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "184120bb-a23d-4fce-a458-195e89cf726a",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
