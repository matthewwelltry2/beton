import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Filter, KeyRound, RefreshCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTypeIconName, getTypeLabel, spbBuildings, type Building } from '@/data/spbBuildings';
import { getIconByName } from '@/lib/iconMap';
import { loadYandexMaps, type YMapInstance, type YPlacemarkInstance } from '@/lib/yandexMapsLoader';

type MapStatus = 'loading' | 'ready' | 'error' | 'no-key';

const typeColorMap: Record<Building['type'], string> = {
  bridge: '#2563eb',
  building: '#475569',
  infrastructure: '#0f766e',
  monument: '#b45309',
};

const mapCenter: [number, number] = [59.93, 30.32];

interface SPBMapProps {
  apiKey?: string;
}

const toDataUri = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getMarkerGlyph = (type: Building['type']) => {
  switch (type) {
    case 'building':
      return `
        <path d="M5 21V6.5L12 4l7 2.5V21" />
        <path d="M9 10v.01M12 10v.01M15 10v.01M9 14v.01M12 14v.01M15 14v.01" />
        <path d="M12 21v-3.5" />
      `;
    case 'bridge':
      return `
        <path d="M3 18h18" />
        <path d="M6 18V10.5M18 18V10.5" />
        <path d="M6 11h12" />
        <path d="M9 18v-3M12 18v-4.5M15 18v-3" />
        <path d="M9.2 11a2.8 2.8 0 0 1 5.6 0" />
      `;
    case 'infrastructure':
      return `
        <rect x="5" y="5" width="14" height="11" rx="2.2" />
        <path d="M8.5 9h2.7M12.8 9h2.7" />
        <path d="M7 16.2 5.7 19M17 16.2 18.3 19" />
        <circle cx="9" cy="13.2" r="1" />
        <circle cx="15" cy="13.2" r="1" />
      `;
    case 'monument':
      return `
        <path d="m12 4-8 3.5h16L12 4Z" />
        <path d="M6.5 7.5v8M10 7.5v8M14 7.5v8M17.5 7.5v8" />
        <path d="M4.5 15.5h15" />
        <path d="M4 20h16" />
      `;
  }
};

const getMarkerSvg = (type: Building['type'], isActive: boolean) => {
  const accent = typeColorMap[type];
  const outerFill = '#ffffff';
  const outerStroke = '#ffffff';
  const centerFill = accent;
  const centerStroke = 'rgba(255,255,255,0.92)';
  const glyphStroke = '#ffffff';
  const glyph = getMarkerGlyph(type);

  return toDataUri(`
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="marker-shadow" x="0" y="0" width="56" height="56" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="1.4" stdDeviation="1.2" flood-color="#64748b" flood-opacity="${isActive ? '0.18' : '0.12'}"/>
        </filter>
      </defs>
      <g filter="url(#marker-shadow)">
        <circle cx="28" cy="28" r="22" fill="${outerFill}" stroke="${outerStroke}" stroke-width="${isActive ? 0.12 : 0.08}" />
        <circle cx="28" cy="28" r="21.2" fill="${centerFill}" stroke="${centerStroke}" stroke-width="0.08" />
        <g transform="translate(19.6 19.6) scale(0.67)" fill="none" stroke="${glyphStroke}" stroke-width="1.18" stroke-linecap="round" stroke-linejoin="round">
          ${glyph}
        </g>
      </g>
    </svg>
  `);
};

const getMarkerOptions = (building: Building, isActive: boolean) => {
  const markerSize = isActive ? 56 : 50;

  return {
    iconLayout: 'default#image',
    iconImageHref: getMarkerSvg(building.type, isActive),
    iconImageSize: [markerSize, markerSize],
    iconImageOffset: [-Math.round(markerSize / 2), -Math.round(markerSize / 2)],
    zIndex: isActive ? 2200 : 1300,
    iconShape: {
      type: 'Circle',
      coordinates: [0, 0],
      radius: Math.round(markerSize * 0.42),
    },
  };
};

const formatCoordinates = (coordinates: [number, number]) =>
  `${coordinates[0].toFixed(4)}, ${coordinates[1].toFixed(4)}`;

export function SPBMap({ apiKey }: SPBMapProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [status, setStatus] = useState<MapStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [filterMode, setFilterMode] = useState<'all' | 'manual'>('all');
  const [manualClassFilter, setManualClassFilter] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const filtersContentRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<YMapInstance | null>(null);
  const placemarksRef = useRef<Map<string, YPlacemarkInstance>>(new Map());
  const selectedPlacemarkIdRef = useRef<string | null>(null);
  const ymapsLoadedRef = useRef<Awaited<ReturnType<typeof loadYandexMaps>> | null>(null);
  const [filtersContentHeight, setFiltersContentHeight] = useState(0);

  const resolvedApiKey = (apiKey ?? import.meta.env.VITE_YMAPS_API_KEY ?? '').trim();

  const classCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const building of spbBuildings) {
      counts.set(building.concreteClass, (counts.get(building.concreteClass) ?? 0) + 1);
    }
    return counts;
  }, []);

  const activeClassFilter = useMemo(() => {
    if (filterMode === 'manual') return manualClassFilter;
    return null;
  }, [filterMode, manualClassFilter]);

  const filteredBuildings = useMemo(
    () => (activeClassFilter ? spbBuildings.filter((building) => building.concreteClass === activeClassFilter) : spbBuildings),
    [activeClassFilter],
  );

  const availableClasses = useMemo(() => [...classCounts.keys()].sort(), [classCounts]);
  const buildingsById = useMemo(() => new Map(spbBuildings.map((building) => [building.id, building])), []);
  const SelectedBuildingIcon = selectedBuilding ? getIconByName(getTypeIconName(selectedBuilding.type)) : null;
  const selectedTypeColor = selectedBuilding ? typeColorMap[selectedBuilding.type] : null;

  const applyPlacemarkState = useCallback((placemark: YPlacemarkInstance, building: Building, isActive: boolean) => {
    if (!placemark.options?.set) return;
    const markerOptions = getMarkerOptions(building, isActive);
    for (const [key, value] of Object.entries(markerOptions)) {
      placemark.options.set(key, value);
    }
  }, []);

  const legendItems = useMemo(
    () => [
      { type: 'building' as const, label: 'Здания' },
      { type: 'bridge' as const, label: 'Мосты' },
      { type: 'infrastructure' as const, label: 'Инфраструктура' },
      { type: 'monument' as const, label: 'Спецобъекты' },
    ],
    [],
  );

  useEffect(() => {
    const node = filtersContentRef.current;
    if (!node) return;

    const updateHeight = () => {
      setFiltersContentHeight(node.scrollHeight);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [availableClasses.length]);

  useEffect(() => {
    if (!resolvedApiKey) {
      setErrorMessage(null);
      setStatus('no-key');
      return;
    }

    let canceled = false;
    setErrorMessage(null);
    setStatus('loading');

    loadYandexMaps(resolvedApiKey)
      .then((ymaps) => {
        if (canceled) return;
        ymapsLoadedRef.current = ymaps;
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (canceled) return;
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error while loading Yandex Maps');
        setStatus('error');
      });

    return () => {
      canceled = true;
    };
  }, [reloadNonce, resolvedApiKey]);

  useEffect(() => {
    if (status !== 'error' || !resolvedApiKey) return;
    const retryTimer = window.setTimeout(() => {
      setReloadNonce((prev) => prev + 1);
    }, 2200);
    return () => window.clearTimeout(retryTimer);
  }, [resolvedApiKey, status]);

  useEffect(() => {
    if (status !== 'ready' || !containerRef.current || !ymapsLoadedRef.current) return;
    if (mapRef.current) return;

    const ymaps = ymapsLoadedRef.current;
    const map = new ymaps.Map(containerRef.current, {
      center: mapCenter,
      zoom: 11,
      controls: [],
    });
    mapRef.current = map;
    map.behaviors?.disable?.('scrollZoom');
    map.options?.set?.('suppressMapOpenBlock', true);
    map.options?.set?.('yandexMapDisablePoiInteractivity', true);

    const fitToViewport = () => {
      map.container?.fitToViewport?.();
    };

    fitToViewport();
    const rafId =
      typeof window.requestAnimationFrame === 'function' ? window.requestAnimationFrame(fitToViewport) : null;
    const timeoutId = window.setTimeout(fitToViewport, 180);
    window.addEventListener('resize', fitToViewport);

    return () => {
      if (rafId !== null && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(rafId);
      }
      window.clearTimeout(timeoutId);
      window.removeEventListener('resize', fitToViewport);
      placemarksRef.current = new Map();
      selectedPlacemarkIdRef.current = null;
      map.destroy();
      mapRef.current = null;
    };
  }, [status]);

  useEffect(() => {
    if (!selectedBuilding) return;
    if (filteredBuildings.some((building) => building.id === selectedBuilding.id)) return;
    setSelectedBuilding(null);
  }, [filteredBuildings, selectedBuilding]);

  useEffect(() => {
    if (status !== 'ready' || !mapRef.current || !ymapsLoadedRef.current) return;

    const ymaps = ymapsLoadedRef.current;
    const map = mapRef.current;
    const currentSelectedId = selectedPlacemarkIdRef.current;

    placemarksRef.current.forEach((placemark) => map.geoObjects.remove(placemark));
    placemarksRef.current.clear();
    selectedPlacemarkIdRef.current = null;

    filteredBuildings.forEach((building) => {
      const isActive = currentSelectedId === building.id;
      const placemark = new ymaps.Placemark(
        building.coordinates,
        {
          hintContent: `${building.name} - ${building.concreteClass}`,
        },
        getMarkerOptions(building, isActive),
      );

      placemark.events.add('click', () => {
        setSelectedBuilding(building);
      });

      map.geoObjects.add(placemark);
      placemarksRef.current.set(building.id, placemark);
      if (isActive) {
        selectedPlacemarkIdRef.current = building.id;
      }
    });
  }, [filteredBuildings, status]);

  useEffect(() => {
    if (status !== 'ready') return;

    const nextSelectedId = selectedBuilding?.id ?? null;
    const previousSelectedId = selectedPlacemarkIdRef.current;
    if (nextSelectedId === previousSelectedId) return;

    if (previousSelectedId) {
      const previousPlacemark = placemarksRef.current.get(previousSelectedId);
      const previousBuilding = buildingsById.get(previousSelectedId);
      if (previousPlacemark && previousBuilding) {
        applyPlacemarkState(previousPlacemark, previousBuilding, false);
      }
    }

    if (nextSelectedId) {
      const nextPlacemark = placemarksRef.current.get(nextSelectedId);
      const nextBuilding = buildingsById.get(nextSelectedId);
      if (nextPlacemark && nextBuilding) {
        applyPlacemarkState(nextPlacemark, nextBuilding, true);
        selectedPlacemarkIdRef.current = nextSelectedId;
        return;
      }
    }

    selectedPlacemarkIdRef.current = null;
  }, [applyPlacemarkState, buildingsById, selectedBuilding?.id, status]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!selectedBuilding) {
      mapRef.current.setCenter(mapCenter, 11, { duration: 420, checkZoomRange: true });
      return;
    }
    mapRef.current.setCenter(selectedBuilding.coordinates, 14, { duration: 560, checkZoomRange: true });
  }, [selectedBuilding]);

  return (
    <div className="surface-panel relative overflow-hidden animate-rise-in-soft">
      <div className="relative border-b border-border/70 bg-white/75 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Карта объектов Санкт-Петербурга</h3>
              <p className="text-sm text-muted-foreground">{filteredBuildings.length} объектов на карте</p>
            </div>
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters((prev) => !prev)}
            className="gap-2 rounded-xl"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
          </Button>
        </div>

        <div
          className={`overflow-hidden transition-[height,opacity] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
            showFilters ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}
          style={{ height: showFilters ? `${filtersContentHeight}px` : '0px' }}
          aria-hidden={!showFilters}
        >
          <div ref={filtersContentRef} className="min-h-0">
            <div className="flex flex-wrap gap-2 pb-0.5">
            <button
              onClick={() => {
                setFilterMode('all');
                setManualClassFilter(null);
                setSelectedBuilding(null);
              }}
              className={`
                action-chip rounded-xl px-4 py-2 text-sm font-medium
                ${
                  filterMode === 'all'
                    ? 'border-primary/30 bg-white/92 text-foreground shadow-[0_12px_24px_-20px_hsl(var(--primary)/0.45)]'
                    : 'border-border/80 bg-white/75 text-muted-foreground'
                }
              `}
            >
              Все объекты ({spbBuildings.length})
            </button>
            {availableClasses.map((cls) => {
              const count = classCounts.get(cls) ?? 0;
              return (
                <button
                  key={cls}
                  onClick={() => {
                    setFilterMode('manual');
                    setManualClassFilter(cls);
                    setSelectedBuilding(null);
                  }}
                  className={`
                    action-chip rounded-xl px-4 py-2 text-sm font-medium
                    ${
                      filterMode === 'manual' && manualClassFilter === cls
                        ? 'border-primary/30 bg-white/92 text-foreground shadow-[0_12px_24px_-20px_hsl(var(--primary)/0.45)]'
                        : 'border-border/80 bg-white/75 text-muted-foreground'
                    }
                  `}
                >
                  {cls} ({count})
                </button>
              );
            })}
            </div>
          </div>
        </div>
      </div>

      <div className="relative h-[560px] md:h-[580px]">
        {status === 'ready' && <div ref={containerRef} className="ymap-minimal h-full w-full bg-secondary/20 [will-change:transform]" />}

        {status === 'loading' && (
          <div className="flex h-full items-center justify-center bg-secondary/30">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              <p className="text-sm text-muted-foreground">Загрузка Яндекс.Карт...</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex h-full items-center justify-center bg-secondary/30 p-6">
            <div className="glass-card max-w-md rounded-2xl border border-danger/20 p-5 text-center">
              <h4 className="mb-2 text-lg font-semibold text-foreground">Не удалось загрузить карту</h4>
              <p className="text-sm text-muted-foreground">
                Проверьте подключение к сети и корректность API-ключа Яндекс.Карт.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Повторная попытка выполняется автоматически.</p>
              {errorMessage && (
                <p className="mt-2 rounded-lg border border-border/70 bg-white/70 p-2 text-left text-xs text-muted-foreground">
                  {errorMessage}
                </p>
              )}
              <Button
                onClick={() => {
                  setReloadNonce((prev) => prev + 1);
                }}
                variant="outline"
                className="mt-4 gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Повторить
              </Button>
            </div>
          </div>
        )}

        {status === 'no-key' && (
          <div className="flex h-full items-center justify-center bg-secondary/30 p-6">
            <div className="glass-card max-w-xl rounded-2xl border border-amber-500/25 p-5">
              <div className="mb-3 flex items-center gap-2 text-amber-600">
                <KeyRound className="h-5 w-5" />
                <h4 className="text-lg font-semibold">Ключ Яндекс.Карт не задан</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Укажите <code>VITE_YMAPS_API_KEY</code> в окружении, чтобы включить карту.
              </p>
              <pre className="mt-4 rounded-lg border border-border/70 bg-white/70 p-3 text-xs">
{`# .env.local
VITE_YMAPS_API_KEY=ваш_ключ_яндекс_карт`}
              </pre>
            </div>
          </div>
        )}

        {selectedBuilding && (
          <div className="pointer-events-none absolute inset-0 p-3 md:p-4">
            <div className="glass-overlay pointer-events-auto ml-auto flex w-full max-w-[430px] animate-fade-in-scale flex-col overflow-hidden rounded-3xl border border-border/75 shadow-[0_26px_54px_-34px_rgb(15_23_42/0.45)]">
              <div className="p-5">
                <div className="mb-4 flex items-start gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border shadow-sm"
                    style={{
                      backgroundColor: selectedTypeColor ?? 'hsl(var(--card))',
                      borderColor: selectedTypeColor ? hexToRgba(selectedTypeColor, 0.48) : 'hsl(var(--border))',
                      color: '#ffffff',
                    }}
                  >
                    {SelectedBuildingIcon && <SelectedBuildingIcon className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {selectedBuilding.concreteClass}
                      </span>
                      <span
                        className="rounded-full border px-2.5 py-1 text-xs font-semibold"
                        style={{
                          borderColor: selectedTypeColor ? hexToRgba(selectedTypeColor, 0.34) : 'hsl(var(--border))',
                          backgroundColor: selectedTypeColor ? hexToRgba(selectedTypeColor, 0.14) : 'hsl(var(--card))',
                          color: selectedTypeColor ?? 'hsl(var(--foreground))',
                        }}
                      >
                        {getTypeLabel(selectedBuilding.type)}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold leading-snug text-foreground md:text-base">{selectedBuilding.name}</h4>
                  </div>
                  <button
                    onClick={() => setSelectedBuilding(null)}
                    className="rounded-lg border border-transparent p-1.5 text-muted-foreground transition-all duration-300 hover:border-border/70 hover:bg-card/85 hover:text-foreground"
                    aria-label="Закрыть карточку объекта"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">{selectedBuilding.description}</p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border/80 bg-card/82 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Класс</div>
                    <div className="text-sm font-semibold text-foreground">{selectedBuilding.concreteClass}</div>
                  </div>
                  <div className="rounded-lg border border-border/80 bg-card/82 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Тип</div>
                    <div className="text-sm font-semibold text-foreground">{getTypeLabel(selectedBuilding.type)}</div>
                  </div>
                  <div className="rounded-lg border border-border/80 bg-card/82 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Координаты</div>
                    <div className="text-xs font-semibold text-foreground">{formatCoordinates(selectedBuilding.coordinates)}</div>
                  </div>
                  <div className="rounded-lg border border-border/80 bg-card/82 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Год</div>
                    <div className="text-sm font-semibold text-foreground">{selectedBuilding.yearBuilt ?? 'н/д'}</div>
                  </div>
                </div>

                {selectedBuilding.source && (
                  <p className="mt-4 rounded-lg border border-border/80 bg-card/82 px-3 py-2 text-xs text-muted-foreground">
                    Источник: {selectedBuilding.source}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 border-t border-border/70 bg-white/58 p-4 text-sm backdrop-blur-md">
        {legendItems.map((item) => {
          const Icon = getIconByName(getTypeIconName(item.type));
          return (
            <div key={item.type} className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70"
                style={{
                  color: typeColorMap[item.type],
                  backgroundColor: hexToRgba(typeColorMap[item.type], 0.14),
                  borderColor: hexToRgba(typeColorMap[item.type], 0.3),
                }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="font-medium text-muted-foreground">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

