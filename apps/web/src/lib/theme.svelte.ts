export type Theme = 'light' | 'dark' | 'auto' | 'high-contrast';

export class ThemeState {
  theme = $state<Theme>('auto');
  isDark = $state(false);

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bovett_theme') as Theme;
      if (stored) {
        this.theme = stored;
      }

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const updateThemeClasses = () => {
        if (this.theme === 'auto') {
          this.isDark = mediaQuery.matches;
        } else {
          this.isDark = this.theme === 'dark';
        }

        const isHighContrast = this.theme === 'high-contrast';

        if (this.isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        if (isHighContrast) {
          document.documentElement.classList.add('high-contrast');
        } else {
          document.documentElement.classList.remove('high-contrast');
        }
      };

      // Initial update
      updateThemeClasses();

      // Listen for system changes
      mediaQuery.addEventListener('change', () => {
        if (this.theme === 'auto') {
          updateThemeClasses();
        }
      });

      // Listen for theme state changes
      $effect.root(() => {
        $effect(() => {
          localStorage.setItem('bovett_theme', this.theme);
          updateThemeClasses();
        });
      });
    }
  }

  setTheme(newTheme: Theme) {
    this.theme = newTheme;
  }
}

export const themeState = new ThemeState();
