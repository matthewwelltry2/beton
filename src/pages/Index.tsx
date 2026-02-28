import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Sparkles } from 'lucide-react';
import { concreteClasses, findConcreteClassById, getDefaultConcreteClassId } from '@/data/concreteClasses';
import { ConcreteCard } from '@/components/ConcreteCard';
import { Header } from '@/components/Header';
import { MixSelector } from '@/components/MixSelector';
import { WhatIfModule } from '@/components/WhatIfModule';
import { DesignerSignature } from '@/components/DesignerSignature';
import { useInViewOnce } from '@/hooks/use-in-view-once';
import { loadYandexMaps } from '@/lib/yandexMapsLoader';
import { IconLab, IconLayers, IconMapSection } from '@/components/icons/custom-icons';

const SPBMap = lazy(() => import('@/components/SPBMap').then((mod) => ({ default: mod.SPBMap })));
const AdvancedComparator = lazy(() =>
  import('@/components/AdvancedComparator').then((mod) => ({ default: mod.AdvancedComparator })),
);
const DetailPanel = lazy(() =>
  import('@/components/DetailPanel').then((mod) => ({ default: mod.DetailPanel })),
);

const sectionIds = ['classes', 'map', 'selector', 'whatif', 'comparator'] as const;

const sectionAnchorStyle: CSSProperties = {
  scrollMarginTop: 'calc(var(--header-height, 96px) + 24px)',
};

const pageLayoutClass = 'mx-auto w-full max-w-[1400px] px-4 md:px-6';
const PANEL_CLOSE_MS = 420;
const DETAIL_PREFETCH_DELAY_MS = 350;

function SectionFallback({ className = 'h-[420px]' }: { className?: string }) {
  return (
    <div className={`glass-card rounded-3xl border border-border/75 p-6 ${className}`}>
      <div className="h-full animate-pulse rounded-2xl bg-secondary/70" />
    </div>
  );
}

const Index = () => {
  const [selectedClassId, setSelectedClassId] = useState<string>(getDefaultConcreteClassId());
  const [activeSection, setActiveSection] = useState<string>('classes');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailClosing, setIsDetailClosing] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const navigationLockRef = useRef<{ sectionId: string; until: number } | null>(null);
  const selectedClass = findConcreteClassById(selectedClassId) ?? concreteClasses[0];

  const comparatorVisibility = useInViewOnce<HTMLDivElement>('180px');

  useEffect(() => {
    const targets = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!targets.length) return;

    let rafId: number | null = null;

    const updateActiveSection = () => {
      rafId = null;
      const headerHeightRaw = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
      const headerHeight = Number.parseInt(headerHeightRaw, 10) || 96;

      const navigationLock = navigationLockRef.current;
      if (navigationLock) {
        const lockTarget = document.getElementById(navigationLock.sectionId);
        if (lockTarget) {
          const lockTop = Math.max(0, lockTarget.offsetTop - headerHeight - 20);
          const delta = Math.abs(window.scrollY - lockTop);
          if (delta <= 8 || Date.now() > navigationLock.until) {
            navigationLockRef.current = null;
          } else {
            setActiveSection((prev) => (prev === navigationLock.sectionId ? prev : navigationLock.sectionId));
            return;
          }
        } else {
          navigationLockRef.current = null;
        }
      }

      const probeY = window.scrollY + headerHeight + 128;
      let nextSectionId = targets[0].id;

      for (const target of targets) {
        if (probeY >= target.offsetTop) {
          nextSectionId = target.id;
          continue;
        }
        break;
      }

      const reachedBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      if (reachedBottom) {
        nextSectionId = targets[targets.length - 1].id;
      }

      setActiveSection((prev) => (prev === nextSectionId ? prev : nextSectionId));
    };

    const scheduleUpdate = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(updateActiveSection);
    };

    const handleNavigationTarget = (event: Event) => {
      const customEvent = event as CustomEvent<{ sectionId: string; until: number }>;
      if (!customEvent.detail?.sectionId) return;

      navigationLockRef.current = {
        sectionId: customEvent.detail.sectionId,
        until: customEvent.detail.until,
      };
      setActiveSection(customEvent.detail.sectionId);
      scheduleUpdate();
    };

    scheduleUpdate();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('grade:navigation-target', handleNavigationTarget as EventListener);

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('grade:navigation-target', handleNavigationTarget as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isDetailOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [isDetailOpen]);

  useEffect(() => {
    const apiKey = (import.meta.env.VITE_YMAPS_API_KEY ?? '').trim();
    if (apiKey) {
      loadYandexMaps(apiKey).catch(() => undefined);
    }
    void import('@/components/SPBMap');
  }, []);

  useEffect(() => {
    const prefetchTimer = window.setTimeout(() => {
      void import('@/components/DetailPanel');
      void import('@/components/StrengthTest');
      void import('@/components/Cube3D');
    }, DETAIL_PREFETCH_DELAY_MS);

    return () => {
      window.clearTimeout(prefetchTimer);
    };
  }, []);

  const openDetails = (classId: string) => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setSelectedClassId(classId);
    setIsDetailClosing(false);
    setIsDetailOpen(true);
  };

  const closeDetails = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }
    setIsDetailClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      setIsDetailOpen(false);
      setIsDetailClosing(false);
      closeTimerRef.current = null;
    }, PANEL_CLOSE_MS);
  };

  useEffect(
    () => () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    },
    [],
  );

  return (
    <div className="relative min-h-screen bg-background" style={{ paddingTop: 'calc(var(--header-height, 96px) + 1.25rem)' }}>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute -right-28 top-[30rem] h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-float [animation-delay:0.8s]" />
      </div>
      <Header activeSection={activeSection} onSectionChange={setActiveSection} />

      <section className="pb-12 pt-8 md:pb-16 md:pt-12">
        <div className={pageLayoutClass}>
          <div className="max-w-4xl animate-rise-in-soft">
            <div className="glass-card mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 px-4 py-2 animate-fade-in">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Интерактивная бетонная лаборатория</span>
            </div>

            <h2 className="animate-fade-in text-4xl font-bold tracking-tight text-foreground stagger-1 md:text-5xl lg:text-[3.45rem]">
              Классы прочности <span className="text-foreground">бетона</span>
            </h2>

            <p className="mb-8 mt-6 max-w-3xl animate-fade-in text-lg leading-relaxed text-muted-foreground stagger-2 md:text-xl">
              Исследуйте поведение бетона в интерактивной 3D-среде, сравнивайте инженерные сценарии и подбирайте класс
              смеси под реальную задачу.
            </p>

            <div className="flex flex-wrap gap-3 animate-fade-in stagger-3">
              <div className="action-chip inline-flex items-center gap-2 px-4 py-2.5">
                <IconLab className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">3D-испытания</span>
              </div>
              <div className="action-chip inline-flex items-center gap-2 px-4 py-2.5">
                <IconMapSection className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-medium">Карта применения</span>
              </div>
              <div className="action-chip inline-flex items-center gap-2 px-4 py-2.5">
                <IconLayers className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">Инженерный подбор</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="classes" className="py-14 md:py-16" style={sectionAnchorStyle}>
        <div className={pageLayoutClass}>
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h3 className="text-2xl font-bold text-foreground md:text-3xl">Таблица классов</h3>
              <p className="mt-2 text-muted-foreground">
                Выберите класс бетона для виртуального испытания и сравнения с другими сценариями.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {concreteClasses.map((concreteClass, index) => (
              <ConcreteCard
                key={concreteClass.id}
                concreteClass={concreteClass}
                isSelected={isDetailOpen && selectedClass.id === concreteClass.id}
                onClick={() => openDetails(concreteClass.id)}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="map" className="py-14 md:py-16" style={sectionAnchorStyle}>
        <div className={pageLayoutClass}>
          <div className="mb-10">
            <h3 className="text-2xl font-bold text-foreground md:text-3xl">Карта применения</h3>
            <p className="mt-2 text-muted-foreground">
              Объекты Санкт-Петербурга и классы бетона, характерные для их несущих конструкций.
            </p>
          </div>
          <Suspense fallback={<SectionFallback className="h-[500px]" />}>
            <SPBMap />
          </Suspense>
        </div>
      </section>

      <section id="selector" className="py-14 md:py-16" style={sectionAnchorStyle}>
        <div className={pageLayoutClass}>
          <div className="mb-10">
            <h3 className="text-2xl font-bold text-foreground md:text-3xl">Подбор класса бетона</h3>
            <p className="mt-2 text-muted-foreground">Пошаговый инженерный конструктор.</p>
          </div>
          <MixSelector />
        </div>
      </section>

      <section id="whatif" className="py-14 md:py-16" style={sectionAnchorStyle}>
        <div className={pageLayoutClass}>
          <div className="mb-10">
            <h3 className="text-2xl font-bold text-foreground md:text-3xl">Что если...?</h3>
            <p className="mt-2 text-muted-foreground">Проверка запаса прочности при выборе класса бетона.</p>
          </div>
          <WhatIfModule />
        </div>
      </section>

      <section id="comparator" className="py-14 md:py-16" style={sectionAnchorStyle}>
        <div className={pageLayoutClass}>
          <div className="mb-10">
            <h3 className="text-2xl font-bold text-foreground md:text-3xl">Продвинутый компаратор</h3>
            <p className="mt-2 text-muted-foreground">
              Сравнивайте предел прочности с инженерными аналогиями и гидростатическим давлением.
            </p>
          </div>
          <div ref={comparatorVisibility.ref}>
            <Suspense fallback={<SectionFallback />}>
              {comparatorVisibility.isVisible ? <AdvancedComparator /> : <SectionFallback />}
            </Suspense>
          </div>
        </div>
      </section>

      <footer className="mt-14 border-t border-border/70 bg-card/55 py-8 backdrop-blur-md">
        <div className={`${pageLayoutClass} text-center`}>
          <p className="text-sm text-muted-foreground">
            <DesignerSignature text="DESIGNED BY NOT SERIOUS" />
          </p>
        </div>
      </footer>

      <Suspense fallback={null}>
        {isDetailOpen && (
          <DetailPanel concreteClass={selectedClass} onClose={closeDetails} isClosing={isDetailClosing} />
        )}
      </Suspense>

      {isDetailOpen && (
        <button
          type="button"
          aria-label="Закрыть панель"
          className={`fixed inset-0 z-[65] bg-slate-950/46 backdrop-blur-md transition-opacity duration-300 will-change-opacity ${
            isDetailClosing ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={closeDetails}
        />
      )}
    </div>
  );
};

export default Index;
