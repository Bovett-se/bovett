import { addMessages, getLocaleFromNavigator, init, locale } from 'svelte-i18n';
import en from './en.json';
import sv from './sv.json';

addMessages('en', en);
addMessages('sv', sv);

function getInitialLocale() {
  if (typeof window === 'undefined') {
    return 'sv';
  }

  try {
    // 1. Check stored preference
    const saved = localStorage.getItem('bovett_locale');
    if (saved && (saved === 'sv' || saved === 'en')) {
      return saved;
    }
  } catch (e) {
    console.error('Failed to get locale from localStorage:', e);
  }

  // 2. Check navigator
  const navLocale = getLocaleFromNavigator();
  if (navLocale && navLocale.startsWith('sv')) {
    return 'sv';
  }

  // 3. Fallback to english
  return 'en';
}

init({
  fallbackLocale: 'en',
  initialLocale: getInitialLocale()
});

// Sync manual changes back to localStorage
if (typeof window !== 'undefined') {
  locale.subscribe((val) => {
    if (val) {
      try {
        localStorage.setItem('bovett_locale', val);
      } catch (e) {
        console.error('Failed to save locale to localStorage:', e);
      }
      document.documentElement.lang = val;
    }
  });
}
