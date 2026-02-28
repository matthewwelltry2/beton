import { lazy, Suspense } from 'react';
import { Ruler, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCategoryColor, getCategoryLabel, type ConcreteClass } from '@/data/concreteClasses';
import { formatMpa } from '@/lib/engineering';
import { IconLab, IconLayers } from '@/components/icons/custom-icons';

const StrengthTest = lazy(() => import('./StrengthTest').then((mod) => ({ default: mod.StrengthTest })));

interface DetailPanelProps {
  concreteClass: ConcreteClass | null;
  onClose: () => void;
  isClosing?: boolean;
}

export function DetailPanel({ concreteClass, onClose, isClosing = false }: DetailPanelProps) {
  if (!concreteClass) return null;

  const categoryColor = getCategoryColor(concreteClass.category);
  const categoryLabel = getCategoryLabel(concreteClass.category);
  const panelStyle = {
    height: 'min(800px, calc(100vh - var(--header-height) - 56px))',
  } as const;

  return (
    <div
      className="pointer-events-none fixed inset-x-4 z-[70] md:inset-x-6 lg:inset-x-10"
      style={{ top: 'calc(var(--header-height) + 50px)' }}
    >
      <div
        className={`detail-panel-motion pointer-events-auto mx-auto flex w-full max-w-[1400px] flex-col overflow-hidden rounded-[30px] border border-border/80 bg-card shadow-[0_34px_72px_-36px_rgb(15_23_42/0.5)] ${
          isClosing ? 'animate-panel-out-bottom' : 'animate-panel-in-bottom'
        }`}
        style={panelStyle}
      >
        <div className="border-b border-border/70 bg-card/95 px-5 pb-4 pt-3 md:px-7 md:pb-5">
          <div className="mb-3 flex justify-center">
            <span className="h-1.5 w-16 rounded-full bg-border/95" />
          </div>

          <div className="flex items-start justify-between gap-3">
            <div>
              <div className={`mb-3 inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${categoryColor}`}>
                {categoryLabel}
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{concreteClass.name}</h2>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-semibold text-primary">{concreteClass.strengthMPa}</span>
                <span className="text-muted-foreground">МПа</span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-10 w-10 rounded-full border border-border/70 bg-card/75 transition-all duration-300 hover:-translate-y-px hover:bg-card"
              aria-label="Закрыть панель"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden px-6 pt-6 pb-8 md:px-8 md:pt-8 md:pb-10">
          <div className="grid h-full gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.95fr)]">
            <div className="space-y-4 xl:order-2">
              <div className="glass-card animate-rise-in-soft rounded-2xl border border-border/75 p-4 shadow-sm stagger-1">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <IconLayers className="h-4 w-4" />
                  Применение
                </h3>
                <p className="text-lg font-medium text-foreground">{concreteClass.application}</p>
              </div>

              <div className="glass-card animate-rise-in-soft rounded-2xl border border-border/75 p-4 shadow-sm stagger-2">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <IconLab className="h-4 w-4" />
                  Описание
                </h3>
                <p className="leading-relaxed text-foreground/80">{concreteClass.description}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 animate-rise-in-soft stagger-3">
                <div className="glass-card rounded-2xl border border-border/75 p-4">
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Ruler className="h-3.5 w-3.5" />
                    Класс
                  </div>
                  <div className="font-mono text-2xl font-bold text-foreground">{concreteClass.name}</div>
                </div>
                <div className="glass-card rounded-2xl border border-primary/22 p-4">
                  <div className="mb-1.5 text-xs text-muted-foreground">Прочность</div>
                  <div className="font-mono text-2xl font-bold text-primary">{formatMpa(concreteClass.strengthMPa)}</div>
                </div>
              </div>
            </div>

            <div className="animate-rise-in-soft rounded-2xl p-4 stagger-4 md:p-4 xl:order-1">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                  <IconLab className="h-4 w-4 text-primary" />
                </div>
                Виртуальное испытание
              </h3>
              <Suspense
                fallback={
                  <div className="rounded-2xl bg-card/70 p-6">
                    <div className="h-40 animate-pulse rounded-xl bg-secondary/75" />
                  </div>
                }
              >
                <StrengthTest concreteClass={concreteClass} compact />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
