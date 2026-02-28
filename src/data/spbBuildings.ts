import type { IconName } from '@/lib/iconMap';

export interface Building {
  id: string;
  name: string;
  description: string;
  concreteClass: string;
  coordinates: [number, number];
  type: 'bridge' | 'building' | 'infrastructure' | 'monument';
  yearBuilt?: number;
  source?: string;
  sourceUrl?: string;
}

export const spbBuildings: Building[] = [
  {
    id: 'spb-1',
    name: 'Жилой комплекс "Балтийская жемчужина"',
    description: 'Крупный жилой район комплексной застройки на юго-западе города.',
    concreteClass: 'B25',
    coordinates: [59.8508, 30.1458],
    type: 'building',
    yearBuilt: 2015,
    source: 'Официальные материалы застройщика',
  },
  {
    id: 'spb-2',
    name: 'ТРЦ "Галерея"',
    description: 'Крупный торгово-развлекательный центр в центральной части города.',
    concreteClass: 'B30',
    coordinates: [59.9299, 30.3612],
    type: 'building',
    yearBuilt: 2010,
    source: 'Паспорт объекта, открытые данные',
  },
  {
    id: 'spb-3',
    name: 'Большой Обуховский мост',
    description: 'Вантовый мост через Неву, один из ключевых транспортных переходов.',
    concreteClass: 'B35',
    coordinates: [59.8543, 30.4878],
    type: 'bridge',
    yearBuilt: 2004,
    source: 'Публичная информация о мостовых сооружениях',
  },
  {
    id: 'spb-4',
    name: 'Лахта Центр',
    description: 'Высотный комплекс с повышенными требованиями к прочности несущих элементов.',
    concreteClass: 'B40',
    coordinates: [59.9871, 30.1775],
    type: 'building',
    yearBuilt: 2019,
    source: 'Материалы проектирования и строительства',
  },
  {
    id: 'spb-5',
    name: 'Станция метро "Адмиралтейская"',
    description: 'Глубокая станция метрополитена с высокими требованиями к подземным конструкциям.',
    concreteClass: 'B45',
    coordinates: [59.9365, 30.3146],
    type: 'infrastructure',
    yearBuilt: 2011,
    source: 'Открытые данные метрополитена',
  },
  {
    id: 'spb-6',
    name: 'Комплекс защитных сооружений Санкт-Петербурга',
    description: 'Дамба и инженерные элементы защиты города от наводнений.',
    concreteClass: 'B50',
    coordinates: [59.9912, 29.7687],
    type: 'infrastructure',
    yearBuilt: 2011,
    source: 'Дирекция КЗС, открытые публикации',
  },
  {
    id: 'spb-7',
    name: 'Мостовой узел ЗСД (центральный участок)',
    description: 'Ответственные эстакадные и опорные элементы скоростной автомагистрали.',
    concreteClass: 'B55',
    coordinates: [59.9148, 30.2305],
    type: 'bridge',
    yearBuilt: 2016,
    source: 'Проектные материалы ЗСД',
  },
  {
    id: 'spb-8',
    name: 'Судоходный шлюз КЗС',
    description: 'Гидротехнические конструкции с интенсивным водонапорным воздействием.',
    concreteClass: 'B60',
    coordinates: [59.9849, 29.7164],
    type: 'infrastructure',
    yearBuilt: 2011,
    source: 'Технические материалы КЗС',
  },
  {
    id: 'spb-9',
    name: 'Пилотный участок сверхпрочных опор',
    description: 'Инженерный участок для сверхвысоких классов бетона.',
    concreteClass: 'B70',
    coordinates: [59.9718, 30.2804],
    type: 'infrastructure',
    source: 'Учебно-демонстрационная модель',
  },
  {
    id: 'spb-10',
    name: 'Специальный фундаментный блок полигона',
    description: 'Демонстрационная площадка для проверки высокопрочных составов.',
    concreteClass: 'B80',
    coordinates: [59.9438, 30.1947],
    type: 'infrastructure',
    source: 'Учебно-лабораторные данные',
  },
  {
    id: 'spb-11',
    name: 'Экспериментальный стенд сверхпрочного бетона',
    description: 'Тестовый объект для моделирования предельных нагрузок.',
    concreteClass: 'B90',
    coordinates: [59.9202, 30.2561],
    type: 'monument',
    source: 'Исследовательская демонстрация',
  },
];

export const getBuildingsByClass = (concreteClass: string): Building[] =>
  spbBuildings.filter((building) => building.concreteClass === concreteClass);

export const getTypeIconName = (type: Building['type']): IconName => {
  switch (type) {
    case 'bridge':
      return 'bridge';
    case 'building':
      return 'building';
    case 'infrastructure':
      return 'train';
    case 'monument':
      return 'landmark';
  }
};

export const getTypeLabel = (type: Building['type']): string => {
  switch (type) {
    case 'bridge':
      return 'Мост';
    case 'building':
      return 'Здание';
    case 'infrastructure':
      return 'Инфраструктура';
    case 'monument':
      return 'Спецобъект';
  }
};
