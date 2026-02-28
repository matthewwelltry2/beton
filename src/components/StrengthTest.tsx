import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Gauge, Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ConcreteClass } from '@/data/concreteClasses';
import { formatMpa } from '@/lib/engineering';
import {
  DEFAULT_STRENGTH_SIMULATION_CONFIG,
  getStrengthSimulationSnapshot,
  type CubeState,
} from '@/lib/strengthSimulation';
import { ComparisonModule } from './ComparisonModule';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';

const Cube3D = lazy(() => import('./Cube3D').then((mod) => ({ default: mod.Cube3D })));

interface StrengthTestProps {
  concreteClass: ConcreteClass;
  compact?: boolean;
}

type TestState = 'idle' | 'running' | 'paused' | 'complete';

export function StrengthTest({ concreteClass, compact = false }: StrengthTestProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [testState, setTestState] = useState<TestState>('idle');
  const [currentLoad, setCurrentLoad] = useState(0);
  const [cubeState, setCubeState] = useState<CubeState>('intact');
  const [isShaking, setIsShaking] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const elapsedMsRef = useRef(0);

  const maxLoad = concreteClass.strengthMPa;
  const safeMaxLoad = maxLoad > 0 ? maxLoad : 1;
  const crackThreshold = maxLoad * DEFAULT_STRENGTH_SIMULATION_CONFIG.crackRatio;
  const progressPercent = Math.min(Math.max((currentLoad / safeMaxLoad) * 100, 0), 100);
  const crackPercent = Math.min(Math.max((crackThreshold / safeMaxLoad) * 100, 0), 100);

  const stopAnimation = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    startTimeRef.current = null;
  }, []);

  const resetTest = useCallback(() => {
    stopAnimation();
    elapsedMsRef.current = 0;
    setTestState('idle');
    setCurrentLoad(0);
    setCubeState('intact');
    setIsShaking(false);
  }, [stopAnimation]);

  const tick = useCallback(
    (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp - elapsedMsRef.current;
      }
      const elapsedMs = timestamp - startTimeRef.current;
      elapsedMsRef.current = elapsedMs;

      const snapshot = getStrengthSimulationSnapshot(elapsedMs, maxLoad, DEFAULT_STRENGTH_SIMULATION_CONFIG);

      setCurrentLoad(snapshot.load);
      setCubeState(snapshot.cubeState);
      setIsShaking(!reducedMotion && snapshot.isShaking);

      if (snapshot.isComplete) {
        setTestState('complete');
        stopAnimation();
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    },
    [maxLoad, reducedMotion, stopAnimation],
  );

  const runFromCurrentPoint = useCallback(() => {
    stopAnimation();
    setTestState('running');
    setIsShaking(false);
    startTimeRef.current = null;
    frameRef.current = requestAnimationFrame(tick);
  }, [stopAnimation, tick]);

  const startTest = useCallback(() => {
    elapsedMsRef.current = 0;
    setCurrentLoad(0);
    setCubeState('intact');
    runFromCurrentPoint();
  }, [runFromCurrentPoint]);

  const pauseTest = useCallback(() => {
    if (testState !== 'running') return;
    stopAnimation();
    setIsShaking(false);
    setTestState('paused');
  }, [stopAnimation, testState]);

  const resumeTest = useCallback(() => {
    if (testState !== 'paused') return;
    runFromCurrentPoint();
  }, [runFromCurrentPoint, testState]);

  const getStateControlsClass = (stateKey: TestState) =>
    `absolute inset-0 flex items-center justify-center gap-3 transition-opacity duration-200 ease-out will-change-opacity ${
      testState === stateKey ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
    }`;

  useEffect(() => {
    resetTest();
  }, [concreteClass.id, resetTest]);

  useEffect(() => () => stopAnimation(), [stopAnimation]);

  return (
    <div className={`${compact ? 'space-y-4' : 'space-y-6'} animate-rise-in-soft`}>
      <Suspense
        fallback={
          <div className={`${compact ? 'h-56' : 'h-72'} w-full animate-pulse rounded-2xl bg-secondary/35`} />
        }
      >
        <Cube3D
          state={cubeState}
          progress={currentLoad}
          maxProgress={maxLoad}
          isShaking={isShaking}
          seedKey={concreteClass.id}
          compact={compact}
        />
      </Suspense>

      <div className="text-center">
        <div
          className={`inline-flex items-baseline gap-3 rounded-2xl border border-border/85 bg-card ${compact ? 'px-4 py-3' : 'px-6 py-4'} shadow-[0_12px_26px_-22px_rgb(15_23_42/0.45)]`}
        >
          <Gauge className={`${compact ? 'h-5 w-5' : 'h-6 w-6'} text-primary`} />
          <span
            className={`${compact ? 'text-3xl' : 'text-4xl'} font-mono font-bold text-foreground ${reducedMotion ? '' : 'animate-number'}`}
          >
            {currentLoad.toFixed(1)}
          </span>
          <span className={`${compact ? 'text-base' : 'text-lg'} text-muted-foreground`}>/ {formatMpa(maxLoad)}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="pressure-track relative h-4">
          <div
            className={`pressure-fill h-full bg-black dark:bg-white ${
              testState === 'running' ? 'pressure-fill-live' : 'pressure-fill-idle'
            } ${
              testState === 'running' && !reducedMotion ? 'animate-progress-pulse' : ''
            }`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
          {testState === 'running' && !reducedMotion && (
            <div className="pointer-events-none absolute inset-0 opacity-20 animate-shimmer" />
          )}
          <div className="pressure-mark" style={{ left: `${crackPercent}%` }} />
        </div>
        <div className="pressure-scale">
          <span style={{ left: '0%', transform: 'translateX(0)' }}>0 МПа</span>
          <span style={{ left: `${crackPercent}%` }}>{formatMpa(crackThreshold)} — трещины</span>
          <span style={{ left: '100%', transform: 'translateX(-100%)' }}>{formatMpa(maxLoad)} — разрушение</span>
        </div>
      </div>

      <div className="flex justify-center">
        <span
          className={`
            inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold
            ${testState === 'idle' ? 'border-border/75 bg-card/70 text-muted-foreground' : ''}
            ${testState === 'running' ? 'border-primary/25 bg-primary/10 text-primary' : ''}
            ${testState === 'paused' ? 'border-amber-400/30 bg-amber-500/12 text-amber-600 dark:text-amber-400' : ''}
            ${testState === 'complete' ? 'border-success/30 bg-success/10 text-success' : ''}
          `}
        >
          {testState === 'idle' && 'Готов к запуску'}
          {testState === 'running' && 'Испытание выполняется'}
          {testState === 'paused' && 'Испытание на паузе'}
          {testState === 'complete' && 'Испытание завершено'}
        </span>
      </div>

      <div className={`${compact ? 'pt-1' : 'pt-2'} relative mx-auto min-h-[56px] w-full max-w-[760px]`}>
        <div className={getStateControlsClass('idle')}>
          <Button onClick={startTest} size="lg" className="gap-2 rounded-2xl px-7">
            <Play className="h-5 w-5" />
            Протестировать прочность
          </Button>
        </div>

        <div className={getStateControlsClass('running')}>
          <Button onClick={pauseTest} size="lg" className="gap-2 rounded-2xl px-7">
            <Pause className="h-5 w-5" />
            Пауза
          </Button>
          <Button onClick={resetTest} size="lg" variant="outline" className="gap-2 rounded-2xl px-6">
            <RotateCcw className="h-5 w-5" />
            С начала
          </Button>
        </div>

        <div className={getStateControlsClass('paused')}>
          <Button onClick={resumeTest} size="lg" className="gap-2 rounded-2xl px-7">
            <Play className="h-5 w-5" />
            Продолжить
          </Button>
          <Button onClick={resetTest} size="lg" variant="outline" className="gap-2 rounded-2xl px-6">
            <RotateCcw className="h-5 w-5" />
            С начала
          </Button>
        </div>

        <div className={getStateControlsClass('complete')}>
          <Button onClick={startTest} size="lg" variant="outline" className="gap-2 rounded-2xl px-7">
            <RotateCcw className="h-5 w-5" />
            Повторить испытание
          </Button>
        </div>
      </div>

      {testState === 'complete' && !compact && (
        <div className="animate-fade-in pt-4">
          <ComparisonModule strengthMPa={maxLoad} concreteClassName={concreteClass.name} />
        </div>
      )}
    </div>
  );
}
