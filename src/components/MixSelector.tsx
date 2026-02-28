import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { concreteClasses } from '@/data/concreteClasses';
import { calcEffectiveRequiredStrength, formatMpa, pickConcreteClassByStrength } from '@/lib/engineering';
import { getIconByName, type IconName } from '@/lib/iconMap';

interface ConstructionType {
  id: string;
  name: string;
  icon: IconName;
  minClass: string;
  description: string;
}

interface LoadCondition {
  id: string;
  name: string;
  multiplier: number;
  icon: IconName;
}

interface Environment {
  id: string;
  name: string;
  requirement: string;
  icon: IconName;
  factor: number;
}

const constructionTypes: ConstructionType[] = [
  {
    id: 'foundation_small',
    name: 'Фундамент частного дома',
    icon: 'home',
    minClass: 'B20',
    description: 'Ленточный или плитный фундамент для 1-2 этажей',
  },
  {
    id: 'foundation_multi',
    name: 'Фундамент многоэтажки',
    icon: 'building',
    minClass: 'B25',
    description: 'Монолитный фундамент для жилых и офисных зданий',
  },
  {
    id: 'slab',
    name: 'Плита перекрытия',
    icon: 'box',
    minClass: 'B25',
    description: 'Сборные и монолитные межэтажные перекрытия',
  },
  {
    id: 'column',
    name: 'Несущая колонна',
    icon: 'columns',
    minClass: 'B30',
    description: 'Каркасные элементы с повышенной нагрузкой',
  },
  {
    id: 'bridge',
    name: 'Мостовая конструкция',
    icon: 'bridge',
    minClass: 'B35',
    description: 'Опоры и пролеты транспортных мостов',
  },
  {
    id: 'highrise',
    name: 'Высотное здание',
    icon: 'highrise',
    minClass: 'B40',
    description: 'Несущие элементы зданий выше 20 этажей',
  },
  {
    id: 'metro',
    name: 'Тоннель / Метро',
    icon: 'train',
    minClass: 'B45',
    description: 'Подземные сооружения глубокого заложения',
  },
  {
    id: 'dam',
    name: 'Плотина',
    icon: 'dam',
    minClass: 'B50',
    description: 'Плотины, дамбы, шлюзовые камеры',
  },
];

const loadConditions: LoadCondition[] = [
  { id: 'static', name: 'Статическая нагрузка', multiplier: 1, icon: 'arrow-down' },
  { id: 'dynamic', name: 'Динамическая нагрузка', multiplier: 1.15, icon: 'activity' },
  { id: 'seismic', name: 'Сейсмическая зона', multiplier: 1.25, icon: 'zap' },
  { id: 'heavy', name: 'Повышенные нагрузки', multiplier: 1.35, icon: 'dumbbell' },
];

const environments: Environment[] = [
  { id: 'normal', name: 'Нормальные условия', requirement: 'Стандартная защита', icon: 'sun', factor: 0 },
  { id: 'wet', name: 'Влажная среда', requirement: 'Водонепроницаемость W6+', icon: 'droplets', factor: 0.08 },
  { id: 'frost', name: 'Морозы ниже -30°C', requirement: 'Морозостойкость F200+', icon: 'snowflake', factor: 0.1 },
  {
    id: 'aggressive',
    name: 'Агрессивная среда',
    requirement: 'Сульфатостойкий состав',
    icon: 'hazard',
    factor: 0.18,
  },
];

export function MixSelector() {
  const [step, setStep] = useState(1);
  const [selectedConstruction, setSelectedConstruction] = useState<ConstructionType | null>(null);
  const [selectedLoad, setSelectedLoad] = useState<LoadCondition | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
  const [showResult, setShowResult] = useState(false);

  const recommendation = useMemo(() => {
    if (!selectedConstruction || !selectedLoad || !selectedEnvironment) return null;

    const baseClass = concreteClasses.find((item) => item.name === selectedConstruction.minClass);
    if (!baseClass) return null;

    const requiredStrength = calcEffectiveRequiredStrength(
      baseClass.strengthMPa,
      selectedLoad.multiplier,
      selectedEnvironment.factor,
    );
    const recommendedClass = pickConcreteClassByStrength(requiredStrength);

    return { baseClass, requiredStrength, recommendedClass };
  }, [selectedConstruction, selectedEnvironment, selectedLoad]);

  const canProceed = () => {
    if (step === 1) return selectedConstruction !== null;
    if (step === 2) return selectedLoad !== null;
    if (step === 3) return selectedEnvironment !== null;
    return false;
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((prev) => prev + 1);
      return;
    }
    setShowResult(true);
  };

  const handleBack = () => {
    if (showResult) {
      setShowResult(false);
      return;
    }
    if (step > 1) setStep((prev) => prev - 1);
  };

  const resetWizard = () => {
    setStep(1);
    setSelectedConstruction(null);
    setSelectedLoad(null);
    setSelectedEnvironment(null);
    setShowResult(false);
  };

  const steps = [
    { stage: 1, label: 'Конструкция' },
    { stage: 2, label: 'Нагрузки' },
    { stage: 3, label: 'Среда' },
  ] as const;
  const stepProgress = (step - 1) / (steps.length - 1);

  return (
    <div className="surface-panel overflow-hidden animate-rise-in-soft">
      {!showResult && (
        <div className="border-b border-border/70 bg-white/58 p-5">
          <div className="relative">
            <div className="pointer-events-none absolute left-[16.6667%] right-[16.6667%] top-5 h-[2px] rounded-full bg-border/80" />
            <div
              className="pointer-events-none absolute left-[16.6667%] top-5 h-[2px] rounded-full bg-primary/70 transition-all duration-500"
              style={{ width: `calc((100% - 33.3334%) * ${stepProgress})` }}
            />
            <div className="grid grid-cols-3 gap-2">
              {steps.map(({ stage, label }) => (
                <div key={stage} className="flex min-w-0 flex-col items-center text-center">
                  <div
                    className={`
                      relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold shadow-sm transition-colors duration-300
                      ${step === stage ? 'border-foreground/22 bg-foreground text-background' : ''}
                      ${step > stage ? 'border-foreground/22 bg-foreground text-background' : ''}
                      ${step < stage ? 'border-border/85 bg-muted text-foreground/75' : ''}
                    `}
                  >
                    {step > stage ? <Check className="h-5 w-5" /> : stage}
                  </div>
                  <span
                    className={`mt-3 text-xs font-medium sm:text-sm ${
                      step >= stage ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="p-5">
        {!showResult && (
          <>
            {step === 1 && (
              <div className="space-y-4 animate-rise-in-soft">
                <h4 className="text-sm font-semibold text-foreground">Выберите тип конструкции</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {constructionTypes.map((type) => {
                    const Icon = getIconByName(type.icon);
                    const isSelected = selectedConstruction?.id === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedConstruction(type)}
                        className={`
                          action-chip relative rounded-2xl p-4 text-left
                          ${
                            isSelected
                              ? 'border-foreground/28 bg-card shadow-[inset_0_0_0_1px_hsl(var(--foreground)/0.18)]'
                              : 'border-border/80 bg-card/86'
                          }
                        `}
                      >
                        {isSelected && (
                          <span className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-foreground/10 bg-foreground text-background">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )}
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${
                              isSelected
                                ? 'border-foreground/20 bg-foreground text-background'
                                : 'border-border/90 bg-card text-foreground'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-foreground">{type.name}</div>
                            <div className="mt-0.5 truncate text-xs text-muted-foreground">{type.description}</div>
                          </div>
                          <span
                            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                              isSelected
                                ? 'border-foreground/18 bg-foreground text-background'
                                : 'border-border/85 bg-muted text-foreground'
                            }`}
                          >
                            от {type.minClass}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-rise-in-soft">
                <h4 className="text-sm font-semibold text-foreground">Условия нагружения</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {loadConditions.map((load) => {
                    const Icon = getIconByName(load.icon);
                    const isSelected = selectedLoad?.id === load.id;
                    return (
                      <button
                        key={load.id}
                        onClick={() => setSelectedLoad(load)}
                        className={`
                          action-chip relative rounded-2xl p-4 text-left
                          ${
                            isSelected
                              ? 'border-foreground/28 bg-card shadow-[inset_0_0_0_1px_hsl(var(--foreground)/0.18)]'
                              : 'border-border/80 bg-card/86'
                          }
                        `}
                      >
                        {isSelected && (
                          <span className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-foreground/10 bg-foreground text-background">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )}
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${
                              isSelected
                                ? 'border-foreground/20 bg-foreground text-background'
                                : 'border-border/90 bg-card text-foreground'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <div>
                            <div className="font-semibold text-foreground">{load.name}</div>
                            <div className="mt-1 text-xs font-medium text-muted-foreground">
                              Коэффициент ×{load.multiplier.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-rise-in-soft">
                <h4 className="text-sm font-semibold text-foreground">Условия эксплуатации</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {environments.map((env) => {
                    const Icon = getIconByName(env.icon);
                    const isSelected = selectedEnvironment?.id === env.id;
                    return (
                      <button
                        key={env.id}
                        onClick={() => setSelectedEnvironment(env)}
                        className={`
                          action-chip relative rounded-2xl p-4 text-left
                          ${
                            isSelected
                              ? 'border-foreground/28 bg-card shadow-[inset_0_0_0_1px_hsl(var(--foreground)/0.18)]'
                              : 'border-border/80 bg-card/86'
                          }
                        `}
                      >
                        {isSelected && (
                          <span className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-foreground/10 bg-foreground text-background">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )}
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${
                              isSelected
                                ? 'border-foreground/20 bg-foreground text-background'
                                : 'border-border/90 bg-card text-foreground'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <div>
                            <div className="font-semibold text-foreground">{env.name}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{env.requirement}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-between border-t border-border pt-5">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step === 1}
                className="gap-2 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="gap-2 rounded-xl"
              >
                {step === 3 ? 'Показать рекомендацию' : 'Далее'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {showResult && recommendation && (
          <div className="space-y-5 animate-rise-in-soft">
            <div className="glass-card rounded-2xl border border-primary/25 p-8 shadow-[0_16px_32px_-24px_hsl(var(--primary)/0.45)]">
              <div className="text-center">
                <div className="mb-3 text-sm font-medium text-muted-foreground">Рекомендуемый класс бетона</div>
                <div className="mb-2 text-6xl font-bold text-primary">{recommendation.recommendedClass.name}</div>
                <div className="font-mono text-2xl text-foreground">{formatMpa(recommendation.recommendedClass.strengthMPa)}</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="flex items-center gap-2 font-semibold text-foreground">
                <Info className="h-4 w-4 text-primary" />
                Параметры расчета
              </h4>
              <div className="grid gap-2 text-sm">
                <div className="glass-card rounded-xl border border-border/75 p-4">
                  Базовый минимум по конструкции: <span className="font-semibold">{recommendation.baseClass.name}</span>{' '}
                  ({formatMpa(recommendation.baseClass.strengthMPa)})
                </div>
                <div className="glass-card rounded-xl border border-border/75 p-4">
                  Требуемая расчетная прочность:{' '}
                  <span className="font-semibold">{formatMpa(recommendation.requiredStrength)}</span>
                </div>
                <div className="glass-card rounded-xl border border-border/75 p-4">
                  Рекомендуемый класс: <span className="font-semibold">{recommendation.recommendedClass.name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-border/75 bg-card/55 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-foreground" />
              <p className="text-sm text-muted-foreground">
                Рекомендация носит информационный характер. Финальный подбор состава должен выполняться по проектным
                данным, геологии и требованиям нормативной документации.
              </p>
            </div>

            <Button variant="outline" onClick={resetWizard} className="w-full">
              Начать заново
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}



