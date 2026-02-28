import { useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw, Scale, Sparkles, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { concreteClasses, findConcreteClassById, getDefaultConcreteClassId } from '@/data/concreteClasses';
import { calcHydroDepthFromMpa } from '@/lib/engineering';
import { getIconByName, type IconName } from '@/lib/iconMap';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';

interface ComparisonObject {
  id: string;
  name: string;
  icon: IconName;
  pressureMPa: number;
  description: string;
}

interface StackedItem {
  object: ComparisonObject;
  count: number;
}

type ComparatorViewMode = 'objects' | 'depth';

const comparisonObjects: ComparisonObject[] = [
  { id: 'finger', name: 'Нажатие рукой', icon: 'hand', pressureMPa: 0.01, description: 'Локальное давление ладонью' },
  { id: 'book', name: 'Стопка книг', icon: 'book', pressureMPa: 0.05, description: 'Малая бытовая нагрузка' },
  { id: 'car_tire', name: 'Шина автомобиля', icon: 'car', pressureMPa: 0.25, description: 'Около 2.5 атм' },
  { id: 'weight', name: 'Силовая платформа', icon: 'weight', pressureMPa: 0.5, description: 'Точечная высокая нагрузка' },
  { id: 'diver_10m', name: 'Глубина 10 м', icon: 'person', pressureMPa: 0.1, description: 'Примерно 1 атм давления' },
  { id: 'submarine', name: 'Подводная лодка', icon: 'ship', pressureMPa: 10, description: 'Экстремальные глубины' },
];

const depthSteps = [0, 0.25, 0.5, 0.75, 1] as const;

const formatMpa = (value: number, digits = 1): string => `${value.toFixed(digits)} МПа`;
const formatDepth = (value: number): string => `${Math.round(value)} м`;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const easeSmootherStep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

function useAnimatedNumber(target: number, durationMs: number, reducedMotion: boolean) {
  const [animatedValue, setAnimatedValue] = useState(target);
  const previousValueRef = useRef(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    const start = previousValueRef.current;
    if (reducedMotion || durationMs <= 0 || Math.abs(target - start) < 0.001) {
      previousValueRef.current = target;
      setAnimatedValue(target);
      return;
    }

    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = clamp((now - startedAt) / durationMs, 0, 1);
      const nextValue = start + (target - start) * easeSmootherStep(progress);

      previousValueRef.current = nextValue;
      setAnimatedValue(nextValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      previousValueRef.current = target;
      frameRef.current = null;
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [durationMs, reducedMotion, target]);

  return animatedValue;
}

export function AdvancedComparator() {
  const reducedMotion = usePrefersReducedMotion();
  const [selectedClassId, setSelectedClassId] = useState<string>(getDefaultConcreteClassId());
  const [stack, setStack] = useState<StackedItem[]>([]);
  const [viewMode, setViewMode] = useState<ComparatorViewMode>('objects');
  const stackContentRef = useRef<HTMLDivElement | null>(null);
  const [stackContentHeight, setStackContentHeight] = useState(0);
  const showDepthMode = viewMode === 'depth';

  const selectedClass = findConcreteClassById(selectedClassId) ?? concreteClasses[0];
  const totalPressure = useMemo(() => stack.reduce((sum, item) => sum + item.object.pressureMPa * item.count, 0), [stack]);
  const progressPercent = selectedClass.strengthMPa > 0 ? (totalPressure / selectedClass.strengthMPa) * 100 : 0;
  const remainingStrength = Math.max(selectedClass.strengthMPa - totalPressure, 0);
  const equivalentDepth = calcHydroDepthFromMpa(selectedClass.strengthMPa);
  const maxDepth = calcHydroDepthFromMpa(concreteClasses[concreteClasses.length - 1].strengthMPa);
  const depthMarkerPercent = maxDepth > 0 ? clamp((equivalentDepth / maxDepth) * 100, 0, 100) : 0;

  const animatedStrength = useAnimatedNumber(selectedClass.strengthMPa, 320, reducedMotion);
  const animatedDepth = useAnimatedNumber(equivalentDepth, 400, reducedMotion);

  const ShipIcon = getIconByName('ship');
  const paneTransitionMs = reducedMotion ? 200 : 860;
  const tabTransitionMs = reducedMotion ? 150 : 620;
  const depthMarkerTransitionMs = reducedMotion ? 200 : 920;
  const depthHintTransitionMs = reducedMotion ? 150 : 560;
  const stackTransitionMs = reducedMotion ? 180 : 760;
  const smoothEase = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const showStackPanel = stack.length > 0;

  useEffect(() => {
    const node = stackContentRef.current;
    if (!node) return;

    const updateHeight = () => {
      setStackContentHeight(node.scrollHeight);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [stack, showDepthMode]);

  const addToStack = (obj: ComparisonObject) => {
    setStack((prev) => {
      const existing = prev.find((item) => item.object.id === obj.id);
      if (existing) {
        return prev.map((item) => (item.object.id === obj.id ? { ...item, count: item.count + 1 } : item));
      }
      return [...prev, { object: obj, count: 1 }];
    });
  };

  const removeFromStack = (objId: string) => {
    setStack((prev) =>
      prev
        .map((item) => (item.object.id === objId ? { ...item, count: item.count - 1 } : item))
        .filter((item) => item.count > 0),
    );
  };

  const resetStack = () => setStack([]);

  return (
    <div className="surface-panel overflow-hidden animate-rise-in-soft">
      <div className="relative border-b border-border/70 bg-white/75 p-5">
        <div className="flex justify-start">
          <div className="relative inline-grid w-[220px] grid-cols-2 overflow-hidden rounded-full border border-border/70 bg-card/80 p-1 shadow-sm">
            <span
              aria-hidden
              className={`pointer-events-none absolute inset-y-0.5 left-0.5 rounded-full bg-[#000000] dark:bg-[#ffffff] transition-transform will-change-transform ${
                showDepthMode ? 'translate-x-full' : 'translate-x-0'
              }`}
              style={{ width: 'calc(50% - 2px)', transitionTimingFunction: smoothEase, transitionDuration: `${tabTransitionMs}ms` }}
            />
            <button
              type="button"
              onClick={() => setViewMode('objects')}
              className={`relative z-10 inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors ${
                showDepthMode ? 'text-muted-foreground hover:text-foreground' : 'text-white dark:text-zinc-900'
              }`}
              style={{ transitionTimingFunction: smoothEase, transitionDuration: `${tabTransitionMs}ms` }}
            >
              <Scale className="h-4 w-4" />
              Объекты
            </button>
            <button
              type="button"
              onClick={() => setViewMode('depth')}
              className={`relative z-10 inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors ${
                showDepthMode ? 'text-white dark:text-zinc-900' : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{ transitionTimingFunction: smoothEase, transitionDuration: `${tabTransitionMs}ms` }}
            >
              <Waves className="h-4 w-4" />
              Глубина
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Класс бетона для компаратора</h4>
          <div className="flex flex-wrap gap-2">
            {concreteClasses.map((cls) => {
              const isSelected = selectedClass.id === cls.id;

              return (
                <button
                  key={cls.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedClassId(cls.id);
                    resetStack();
                  }}
                  className={`
                    action-chip rounded-xl px-4 py-2 text-sm
                    ${
                      isSelected
                        ? 'border-black bg-black font-semibold text-white shadow-[0_10px_18px_-14px_rgb(0_0_0/0.6)] hover:border-black hover:bg-black hover:text-white hover:scale-[1.03] hover:shadow-[0_14px_24px_-16px_rgb(0_0_0/0.7)] dark:border-white dark:bg-white dark:text-zinc-900 dark:hover:border-white dark:hover:bg-white dark:hover:text-zinc-900 dark:hover:shadow-[0_14px_24px_-16px_rgb(255_255_255/0.28)]'
                        : 'border-border/80 bg-card/72 text-foreground'
                    }
                  `}
                >
                  {cls.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-primary/22 p-6 text-center shadow-[0_16px_32px_-24px_hsl(var(--primary)/0.45)]">
          <div className="text-sm font-medium text-muted-foreground">Прочность {selectedClass.name}</div>
          <div className="my-3 number-display text-5xl font-bold text-primary tabular-nums">{formatMpa(animatedStrength, 1)}</div>
          <div className="min-h-[1.5rem]">
            <div
              className={`flex items-center justify-center gap-2 text-sm text-muted-foreground transition-opacity ${showDepthMode ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionTimingFunction: smoothEase, transitionDuration: `${depthHintTransitionMs}ms` }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
              Эквивалентно давлению воды на глубине <span className="font-semibold text-primary">{formatDepth(animatedDepth)}</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/55" style={{ height: 'clamp(440px, 62vh, 580px)' }}>
          <div
            className={`absolute inset-0 p-4 transition-all ease-out sm:p-5 ${
              showDepthMode ? 'pointer-events-none translate-y-2 scale-[0.995] opacity-0' : 'translate-y-0 scale-100 opacity-100'
            }`}
            style={{ transitionTimingFunction: smoothEase, transitionDuration: `${paneTransitionMs}ms` }}
          >
            <div className="h-full overflow-y-auto pr-1 scrollbar-hide">
              <div className="mx-auto flex min-h-full w-full max-w-[1080px] flex-col">
                <div>
                  <h4 className="mb-3 text-center text-sm font-semibold text-foreground">Добавьте объекты</h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {comparisonObjects.map((obj) => {
                      const Icon = getIconByName(obj.icon);

                      return (
                        <button
                          key={obj.id}
                          type="button"
                          onClick={() => addToStack(obj)}
                          className="action-chip rounded-xl border-border/80 bg-card/72 p-4 text-left"
                        >
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary/60">
                              <Icon className="h-5 w-5 text-primary" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-foreground">{obj.name}</div>
                              <div className="text-xs text-muted-foreground">{obj.description}</div>
                            </div>
                            <Plus className="h-5 w-5 text-primary" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  className={`overflow-hidden transition-[max-height,opacity,margin] ${
                    showStackPanel ? 'mt-5 opacity-100' : 'mt-0 opacity-0'
                  }`}
                  style={{
                    maxHeight: showStackPanel ? `${stackContentHeight || 1}px` : '0px',
                    transitionTimingFunction: smoothEase,
                    transitionDuration: `${stackTransitionMs}ms`,
                  }}
                  aria-hidden={!showStackPanel}
                >
                  <div ref={stackContentRef} className={`space-y-3 ${showStackPanel ? 'visible' : 'invisible pointer-events-none'}`}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">Ваша стопка давления</h4>
                      <Button variant="ghost" size="sm" onClick={resetStack} className="gap-2 rounded-xl">
                        <RotateCcw className="h-4 w-4" />
                        Сбросить
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {stack.map((item, itemIndex) => {
                        const Icon = getIconByName(item.object.icon);
                        const shouldAnimateItem = itemIndex > 0;

                        return (
                          <div
                            key={item.object.id}
                            className={`inline-flex items-center gap-2 rounded-xl border border-primary/22 bg-card/88 px-4 py-2.5 shadow-sm ${
                              shouldAnimateItem ? 'opacity-0 animate-fade-in-scale' : ''
                            }`}
                            style={
                              shouldAnimateItem
                                ? { animationDelay: `${itemIndex * 80}ms`, animationFillMode: 'forwards' }
                                : undefined
                            }
                          >
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card">
                              <Icon className="h-4 w-4 text-primary" />
                            </span>
                            <span className="text-sm font-semibold text-foreground">×{item.count}</span>
                            <button
                              type="button"
                              onClick={() => removeFromStack(item.object.id)}
                              className="rounded-lg p-1.5 text-danger transition-colors hover:bg-danger/10"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-auto space-y-3 pb-1 pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-foreground">Накопленное давление</span>
                    <span className="font-mono font-semibold">
                      {formatMpa(totalPressure, 2)} / {formatMpa(selectedClass.strengthMPa)}
                    </span>
                  </div>

                  <div className="pressure-track relative h-4">
                    <div
                      className="pressure-fill h-full bg-black dark:bg-white"
                      style={{ width: `${Math.min(progressPercent, 100)}%` }}
                    />
                    <div className="pressure-mark" style={{ left: '70%' }} />
                  </div>

                  <div className="pressure-scale">
                    <span style={{ left: '0%', transform: 'translateX(0)' }}>0%</span>
                    <span style={{ left: '70%' }}>70% - трещины</span>
                    <span style={{ left: '100%', transform: 'translateX(-100%)' }}>100% - разрушение</span>
                  </div>

                  <div className="text-center text-sm">
                    {progressPercent < 100 ? (
                      <span className="text-muted-foreground">
                        Добавьте еще <span className="font-semibold text-primary">{formatMpa(remainingStrength, 2)}</span> до предела прочности.
                      </span>
                    ) : (
                      <span className="font-semibold text-danger">
                        Предел прочности превышен: конструкция теряет несущую способность.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`absolute inset-0 p-4 transition-all ease-out sm:p-5 ${
              showDepthMode ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none -translate-y-2 scale-[0.995] opacity-0'
            }`}
            style={{ transitionTimingFunction: smoothEase, transitionDuration: `${paneTransitionMs}ms` }}
          >
            <div className="relative h-full overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-zinc-100/92 via-zinc-300/88 to-zinc-700 shadow-inner dark:from-zinc-700/55 dark:via-zinc-800/70 dark:to-zinc-950">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/18" />

              <div className="absolute inset-x-6 bottom-5 top-5">
                {depthSteps.map((step) => (
                  <div
                    key={step}
                    className="absolute inset-x-0"
                    style={{
                      top: `${step * 100}%`,
                      transform: step === 0 ? 'translateY(0)' : step === 1 ? 'translateY(-100%)' : 'translateY(-50%)',
                    }}
                  >
                    <div className="border-t border-dashed border-black/35 dark:border-white/25" />
                    <span className="absolute -right-2 -translate-y-1/2 whitespace-nowrap rounded-full border border-black/12 bg-card px-2 py-0.5 text-xs font-semibold text-black/85 dark:text-foreground">
                      {formatDepth(step * maxDepth)}
                    </span>
                  </div>
                ))}

                <div
                  className="absolute inset-x-0 z-20 transition-all ease-out"
                  style={{
                    top: `${depthMarkerPercent}%`,
                    transform: 'translateY(-50%)',
                    transitionTimingFunction: smoothEase,
                    transitionDuration: `${depthMarkerTransitionMs}ms`,
                  }}
                >
                  <div className="absolute inset-x-0 border-t-2 border-foreground/90" />

                  <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                    <div className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-foreground/25 bg-card shadow-[0_10px_18px_-12px_rgb(15_23_42/0.55)]">
                      <ShipIcon className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[calc(100%+0.5rem)]">
                      <div className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-full border border-foreground/25 bg-card px-3 text-sm font-semibold text-foreground shadow-[0_10px_18px_-12px_rgb(15_23_42/0.55)]">
                        {formatDepth(animatedDepth)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

