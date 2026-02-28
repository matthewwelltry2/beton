import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Gauge, Info, XCircle } from 'lucide-react';
import { concreteClasses, findConcreteClassById, getDefaultConcreteClassId } from '@/data/concreteClasses';
import { Slider } from '@/components/ui/slider';
import { formatMpa, pickConcreteClassByStrength } from '@/lib/engineering';
import { getIconByName, type IconName } from '@/lib/iconMap';

interface Structure {
  id: string;
  name: string;
  icon: IconName;
  requiredMPa: number;
  description: string;
}

const structures: Structure[] = [
  { id: 'sidewalk', name: 'Тротуар', icon: 'person', requiredMPa: 15, description: 'Пешеходные дорожки' },
  { id: 'garage', name: 'Гараж', icon: 'car', requiredMPa: 20, description: 'Пол гаража' },
  { id: 'house', name: 'Частный дом', icon: 'home', requiredMPa: 25, description: 'Фундамент дома' },
  { id: 'apartment', name: 'Многоэтажка', icon: 'building', requiredMPa: 32, description: 'Жилой комплекс' },
  { id: 'bridge', name: 'Мост', icon: 'bridge', requiredMPa: 45, description: 'Автомобильный мост' },
  { id: 'dam', name: 'Плотина', icon: 'dam', requiredMPa: 60, description: 'Гидросооружение' },
];

type ScenarioStatus = 'safe' | 'warning' | 'danger';

export function WhatIfModule() {
  const [selectedClassId, setSelectedClassId] = useState<string>(getDefaultConcreteClassId());
  const [selectedStructure, setSelectedStructure] = useState<Structure>(structures[3]);
  const [loadMultiplier, setLoadMultiplier] = useState([1]);
  const selectedClass = findConcreteClassById(selectedClassId) ?? concreteClasses[0];

  const effectiveLoad = selectedStructure.requiredMPa * loadMultiplier[0];
  const safetyMargin = selectedClass.strengthMPa - effectiveLoad;
  const loadPercentage = (effectiveLoad / selectedClass.strengthMPa) * 100;
  const cappedLoadPercentage = Math.min(loadPercentage, 100);
  const requiredClass = pickConcreteClassByStrength(effectiveLoad);
  const status: ScenarioStatus = loadPercentage < 70 ? 'safe' : loadPercentage < 100 ? 'warning' : 'danger';

  const StatusIcon = status === 'safe' ? CheckCircle : status === 'warning' ? AlertTriangle : XCircle;

  const statusLabel = status === 'safe' ? 'Надежно' : status === 'warning' ? 'На границе' : 'Риск';
  const statusTitle =
    status === 'safe'
      ? 'Конструкция выдерживает расчетную нагрузку'
      : status === 'warning'
        ? 'Возможны трещины и ускоренный износ'
        : 'Текущий класс бетона недостаточен';
  const statusDescription =
    status === 'safe'
      ? `Запас прочности: ${formatMpa(safetyMargin)} (${(100 - loadPercentage).toFixed(0)}%).`
      : status === 'warning'
        ? `Нагрузка близка к пределу. Рекомендуется перейти на более высокий класс: ${requiredClass.name}.`
        : `Нагрузка превышает предел на ${formatMpa(Math.abs(safetyMargin))}. Минимально подходящий класс: ${requiredClass.name}.`;

  const statusAccentClass = status === 'safe' ? 'text-success' : status === 'warning' ? 'text-amber-500' : 'text-danger';
  const statusBadgeClass =
    status === 'safe'
      ? 'border-success/30 bg-success/10 text-foreground'
      : status === 'warning'
        ? 'border-amber-400/35 bg-amber-500/10 text-foreground'
        : 'border-danger/35 bg-danger/10 text-foreground';
  const statusSummaryPanelClass = 'border-border/70 bg-card/58';
  const statusBarClass = status === 'safe' ? 'bg-success' : status === 'warning' ? 'bg-amber-500' : 'bg-danger';

  return (
    <div className="surface-panel overflow-hidden animate-rise-in-soft">
      <div className="space-y-4 p-5 md:space-y-5 md:p-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <section className="rounded-2xl border border-border/70 bg-card/58 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Info className="h-4 w-4 text-muted-foreground" />
                Сценарий нагрузки
              </h4>
              <span className="rounded-full border border-border/75 bg-card/78 px-3 py-1 text-xs font-semibold text-foreground">
                {selectedStructure.name}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
              {structures.map((structure) => {
                const Icon = getIconByName(structure.icon);
                const isSelected = selectedStructure.id === structure.id;

                return (
                  <button
                    key={structure.id}
                    type="button"
                    onClick={() => setSelectedStructure(structure)}
                    className={`group rounded-2xl border px-3 py-3 text-left transition-colors duration-300 ${
                      isSelected
                        ? 'border-foreground/26 bg-card text-foreground'
                        : 'border-border/75 bg-card/74 text-muted-foreground hover:border-foreground/20 hover:text-foreground'
                    }`}
                  >
                    <span
                      className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg border ${
                        isSelected
                          ? 'border-foreground/20 bg-foreground text-background'
                          : 'border-border/75 bg-card text-muted-foreground group-hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    <div className="truncate text-sm font-semibold">{structure.name}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{formatMpa(structure.requiredMPa)}</span>
                      <span className="h-1 w-1 rounded-full bg-border/80" />
                      <span className="truncate">{structure.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card/58 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-foreground">Класс бетона для сценария</h4>
              <span className="rounded-full border border-border/75 bg-card/78 px-3 py-1 text-xs font-semibold text-foreground">
                Минимум {requiredClass.name}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7">
              {concreteClasses.map((cls) => (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`rounded-xl border px-3.5 py-2 text-center text-sm font-semibold transition-colors duration-300 ${
                    selectedClass.id === cls.id
                      ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-zinc-900'
                      : 'border-border/80 bg-card/74 text-foreground hover:border-foreground/20'
                  }`}
                >
                  {cls.name}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-border/75 bg-card/72 px-3 py-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Предел</div>
                <div className="mt-1 font-mono text-sm font-semibold text-foreground">{formatMpa(selectedClass.strengthMPa)}</div>
              </div>
              <div className="rounded-xl border border-border/75 bg-card/72 px-3 py-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Нагрузка</div>
                <div className="mt-1 font-mono text-sm font-semibold text-foreground">{formatMpa(effectiveLoad)}</div>
              </div>
              <div className="rounded-xl border border-border/75 bg-card/72 px-3 py-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Запас</div>
                <div className={`mt-1 font-mono text-sm font-semibold ${safetyMargin >= 0 ? 'text-success' : 'text-danger'}`}>
                  {safetyMargin >= 0 ? '+' : '-'}
                  {formatMpa(Math.abs(safetyMargin))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <section className="rounded-2xl border border-border/70 bg-card/58 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Gauge className="h-4 w-4 text-primary" />
                Коэффициент нагрузки
              </h4>
              <span className="rounded-full border border-border/75 bg-card/80 px-3 py-1 font-mono text-base font-semibold text-foreground">
                ×{loadMultiplier[0].toFixed(2)}
              </span>
            </div>
            <Slider
              value={loadMultiplier}
              onValueChange={setLoadMultiplier}
              min={0.5}
              max={2}
              step={0.05}
              className="py-3"
            />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>Пониженная ×0.5</span>
              <span>Нормальная ×1,25</span>
              <span>Повышенная ×2.0</span>
            </div>
          </section>

          <section className={`relative overflow-hidden rounded-2xl border p-4 ${statusSummaryPanelClass}`}>
            <span aria-hidden className={`absolute left-0 top-0 h-full w-1 ${statusBarClass}`} />
            <div className="flex items-start justify-between gap-3 pl-2">
              <div className="flex min-w-0 items-start gap-3">
                <StatusIcon className={`mt-0.5 h-5 w-5 shrink-0 ${statusAccentClass}`} />
                <div className="min-w-0">
                  <h5 className="font-semibold text-foreground">{statusTitle}</h5>
                  <p className="mt-1 text-sm text-muted-foreground">{statusDescription}</p>
                </div>
              </div>
              <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass}`}>
                <StatusIcon className={`h-4 w-4 ${statusAccentClass}`} />
                {statusLabel}
              </span>
            </div>

            <div className="mt-3 rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-xs text-muted-foreground">
              Расчетная нагрузка: <span className="font-mono font-semibold text-foreground">{formatMpa(effectiveLoad)}</span>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-border/70 bg-card/58 p-4 md:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium text-foreground">Нагрузка на конструкцию</span>
            <span className="font-mono font-semibold">
              {formatMpa(effectiveLoad)} / {formatMpa(selectedClass.strengthMPa)}
            </span>
          </div>
          <div className="pressure-track relative h-4">
            <div className="pressure-fill h-full bg-black dark:bg-white" style={{ width: `${cappedLoadPercentage}%` }} />
            <div className="pressure-mark" style={{ left: '70%' }} />
          </div>
          <div className="pressure-scale mt-3">
            <span style={{ left: '0%', transform: 'translateX(0)' }}>0%</span>
            <span style={{ left: '70%' }}>70% — трещины</span>
            <span style={{ left: '100%', transform: 'translateX(-100%)' }}>100% — разрушение</span>
          </div>
        </section>

      </div>
    </div>
  );
}
