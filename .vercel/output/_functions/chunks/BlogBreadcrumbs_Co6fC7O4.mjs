import { e as createAstro, f as createComponent, r as renderTemplate, u as unescapeHTML, h as addAttribute, m as maybeRenderHead } from './astro/server_q9Jx4GKt.mjs';
import 'piccolore';
import 'clsx';
import { g as getLangFromUrl, u as useTranslations } from './Layout__RHZE4WW.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://almacenajes-minidepositos.com");
const $$BlogBreadcrumbs = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BlogBreadcrumbs;
  const { category, articleTitle } = Astro2.props;
  const lang = getLangFromUrl(Astro2.url);
  const t = useTranslations(lang);
  const breadcrumbs = [
    {
      name: t("nav.home"),
      url: lang === "en" ? "/en" : "/",
      current: false
    },
    {
      name: t("nav.blog"),
      url: lang === "en" ? "/en/blog" : "/blog",
      current: !articleTitle
    }
  ];
  if (articleTitle) {
    breadcrumbs.push({
      name: articleTitle,
      url: "",
      current: true
    });
  }
  return renderTemplate(_a || (_a = __template(["", '<nav aria-label="Breadcrumb" class="bg-gray-50 py-3"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> <div class="flex items-center justify-between"> <ol class="flex items-center space-x-2 text-sm"> ', " </ol> ", ' </div> </div> </nav> <!-- Schema.org BreadcrumbList --> <script type="application/ld+json">', "<\/script>"])), maybeRenderHead(), breadcrumbs.map((crumb, index) => renderTemplate`<li class="flex items-center"> ${index > 0 && renderTemplate`<svg class="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path> </svg>`} ${crumb.current ? renderTemplate`<span class="text-gray-700 font-medium" aria-current="page"> ${crumb.name} </span>` : renderTemplate`<a${addAttribute(crumb.url, "href")} class="text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 transition-colors duration-200"> ${crumb.name} </a>`} </li>`), articleTitle && renderTemplate`<a href="/blog" class="inline-flex items-center text-[var(--color-primary)] font-medium hover:text-[var(--color-primary)]/80 transition-colors duration-200 text-sm"> <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path> </svg>
Volver al blog
</a>`, unescapeHTML(JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url ? `https://almacenajes-minidepositos.com${crumb.url}` : void 0
    }))
  })));
}, "C:/Users/gerenteit/Desktop/Semah/Sistemas/Landing AMD v2/landingamdv2/src/components/BlogBreadcrumbs.astro", void 0);

export { $$BlogBreadcrumbs as $ };
