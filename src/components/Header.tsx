import { useEffect, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import {
  IconClasses,
  IconComparator,
  IconMapSection,
  IconScenario,
  IconSelector,
} from '@/components/icons/custom-icons';
import { GradeLogo } from '@/components/icons/grade-logo';

interface HeaderProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

type ThemeMode = 'light' | 'dark';
type NavigationTargetDetail = {
  sectionId: string;
  until: number;
};

const THEME_STORAGE_KEY = 'grade-theme';

const navItems = [
  { id: 'classes', icon: IconClasses, label: 'Классы' },
  { id: 'map', icon: IconMapSection, label: 'Карта СПб' },
  { id: 'selector', icon: IconSelector, label: 'Подбор' },
  { id: 'whatif', icon: IconScenario, label: 'Что если?' },
  { id: 'comparator', icon: IconComparator, label: 'Сравнение' },
] as const;

const applyTheme = (mode: ThemeMode) => {
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark');
  root.style.colorScheme = mode;
};

const readStoredTheme = (): ThemeMode | null => {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return null;
  } catch {
    return null;
  }
};

export function Header({ activeSection, onSectionChange }: HeaderProps) {
  const headerRef = useRef<HTMLElement | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const root = document.documentElement;
    const updateHeight = () => {
      root.style.setProperty('--header-height', `${Math.ceil(header.getBoundingClientRect().height)}px`);
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(header);
    window.addEventListener('resize', updateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = readStoredTheme();
    const initialTheme: ThemeMode = savedTheme ?? (mediaQuery.matches ? 'dark' : 'light');

    setThemeMode(initialTheme);
    applyTheme(initialTheme);

    const onPreferenceChange = (event: MediaQueryListEvent) => {
      if (readStoredTheme()) return;
      const nextTheme: ThemeMode = event.matches ? 'dark' : 'light';
      setThemeMode(nextTheme);
      applyTheme(nextTheme);
    };

    mediaQuery.addEventListener('change', onPreferenceChange);
    return () => {
      mediaQuery.removeEventListener('change', onPreferenceChange);
    };
  }, []);

  const toggleTheme = () => {
    setThemeMode((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // Ignore localStorage failures (private mode / blocked storage).
      }
      return next;
    });
  };

  const scrollToSection = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;

    onSectionChange(id);
    const headerHeightRaw = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
    const headerHeight = Number.parseInt(headerHeightRaw, 10) || 96;
    const top =
      id === 'classes'
        ? 0
        : Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight - 20);

    const detail: NavigationTargetDetail = {
      sectionId: id,
      until: Date.now() + 1200,
    };

    window.dispatchEvent(new CustomEvent<NavigationTargetDetail>('grade:navigation-target', { detail }));
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <header className="fixed inset-x-0 top-3 z-[90] px-3 md:px-5 lg:px-8" ref={headerRef}>
      <div className="glass-overlay mx-auto max-w-[1400px] rounded-[28px] border border-border/75 shadow-[0_24px_42px_-34px_rgb(15_23_42/0.45)]">
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between gap-3 py-3">
            <button
              onClick={() => scrollToSection('classes')}
              className="inline-flex items-center justify-center rounded-2xl px-2 py-1.5"
            >
              <GradeLogo themeMode={themeMode} />
            </button>

            <nav className="hidden items-center gap-2 xl:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`
                      inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium
                      transition-all duration-300
                      ${
                        isActive
                          ? 'border-primary/30 bg-primary text-primary-foreground shadow-[0_12px_26px_-18px_hsl(var(--primary)/0.75)]'
                          : 'border-border/75 bg-white/68 text-muted-foreground hover:-translate-y-px hover:border-primary/25 hover:bg-white/90 hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={toggleTheme}
              className="action-chip inline-flex items-center gap-2 rounded-full border border-border/75 bg-white/72 px-3 py-2 text-xs font-semibold text-foreground md:text-sm"
              aria-label={themeMode === 'dark' ? 'Включить светлую тему' : 'Включить темную тему'}
            >
              {themeMode === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-500" />
              ) : (
                <Moon className="h-4 w-4 text-primary" />
              )}
              <span className="hidden sm:inline">{themeMode === 'dark' ? 'Светлый режим' : 'Темный режим'}</span>
              <span className="sm:hidden">{themeMode === 'dark' ? 'Светлый' : 'Темный'}</span>
            </button>
          </div>

          <div className="pb-3 lg:hidden">
            <div className="rounded-2xl border border-border/70 bg-white/55 px-2 py-2 backdrop-blur-md">
              <nav className="flex min-w-max items-center gap-2 overflow-x-auto scrollbar-hide">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`
                        inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium
                        transition-all duration-300
                        ${
                          isActive
                            ? 'border-primary/30 bg-primary text-primary-foreground shadow-[0_12px_24px_-18px_hsl(var(--primary)/0.75)]'
                            : 'border-border/75 bg-white/70 text-muted-foreground hover:-translate-y-px hover:border-primary/25 hover:bg-white/90 hover:text-foreground'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
