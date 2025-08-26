import { ui, defaultLang, type UIKeys } from './ui';

export function getLangFromUrl(url: URL): keyof typeof ui {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: UIKeys): string {
    return ui[lang][key] || ui[defaultLang][key];
  };
}

export function getLocalizedPath(path: string, locale: keyof typeof ui): string {
  if (locale === defaultLang) {
    return path;
  }
  return `/${locale}${path}`;
}

export function removeLocaleFromPath(pathname: string): string {
  const segments = pathname.split('/');
  if (segments[1] && segments[1] in ui) {
    return '/' + segments.slice(2).join('/');
  }
  return pathname;
}

export function getCurrentLocale(url: URL): keyof typeof ui {
  return getLangFromUrl(url);
}

export function getAlternateLocale(currentLocale: keyof typeof ui): keyof typeof ui {
  return currentLocale === 'es' ? 'en' : 'es';
}

export function getLocalizedUrl(url: URL, targetLocale: keyof typeof ui): string {
  const currentLocale = getLangFromUrl(url);
  const pathWithoutLocale = removeLocaleFromPath(url.pathname);
  
  if (targetLocale === defaultLang) {
    return pathWithoutLocale + url.search + url.hash;
  }
  
  return `/${targetLocale}${pathWithoutLocale}` + url.search + url.hash;
}
