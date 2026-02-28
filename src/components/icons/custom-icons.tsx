import * as React from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';

const createCustomIcon = (displayName: string, children: React.ReactNode): LucideIcon => {
  const Component = React.forwardRef<SVGSVGElement, LucideProps>(({ size = 24, color = 'currentColor', strokeWidth = 1.8, className, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {children}
    </svg>
  ));

  Component.displayName = displayName;
  return Component as unknown as LucideIcon;
};

export const IconLayers = createCustomIcon(
  'IconLayers',
  <>
    <path d="M12 3 3 7.6 12 12l9-4.4L12 3Z" />
    <path d="M3 12.5 12 17l9-4.5" />
    <path d="M3 17.4 12 22l9-4.6" />
  </>,
);

export const IconMap = createCustomIcon(
  'IconMap',
  <>
    <path d="M3 6.5 8.2 4l7.6 2.5L21 4v13.5l-5.2 2.5-7.6-2.5L3 20V6.5Z" />
    <path d="M8.2 4v13.5" />
    <path d="M15.8 6.5V20" />
    <path d="M12.8 7.8a2.3 2.3 0 1 1 4.6 0c0 1.9-2.3 4.4-2.3 4.4s-2.3-2.5-2.3-4.4Z" />
  </>,
);

export const IconHome = createCustomIcon(
  'IconHome',
  <>
    <path d="M3 10.7 12 3l9 7.7" />
    <path d="M5.2 9.8V21h13.6V9.8" />
    <path d="M10 21v-6h4v6" />
  </>,
);

export const IconBuilding = createCustomIcon(
  'IconBuilding',
  <>
    <path d="M4 21V5.8L12 3l8 2.8V21" />
    <path d="M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
  </>,
);

export const IconBox = createCustomIcon(
  'IconBox',
  <>
    <path d="M12 2.8 4 7v10l8 4.2 8-4.2V7l-8-4.2Z" />
    <path d="M4 7 12 11l8-4" />
    <path d="M12 11v10.2" />
  </>,
);

export const IconColumns = createCustomIcon(
  'IconColumns',
  <>
    <path d="M3 7h18" />
    <path d="M5 7v11M9.7 7v11M14.3 7v11M19 7v11" />
    <path d="M3 18h18" />
    <path d="M2 21h20" />
    <path d="m12 3-9 4h18l-9-4Z" />
  </>,
);

export const IconBridge = createCustomIcon(
  'IconBridge',
  <>
    <path d="M3 19h18" />
    <path d="M5 19V9" />
    <path d="M19 19V9" />
    <path d="M5 13h14" />
    <path d="M8.5 19v-4M12 19v-6M15.5 19v-4" />
    <path d="M5 9c2.2-2.8 11.8-2.8 14 0" />
  </>,
);

export const IconHighrise = createCustomIcon(
  'IconHighrise',
  <>
    <path d="M5 21V6.5h6V3h8v18" />
    <path d="M8.2 9h.01M11.2 9h.01M8.2 12h.01M11.2 12h.01M8.2 15h.01M11.2 15h.01M15 7h.01M18 7h.01M15 10h.01M18 10h.01M15 13h.01M18 13h.01" />
  </>,
);

export const IconTrain = createCustomIcon(
  'IconTrain',
  <>
    <rect x="5" y="4" width="14" height="13" rx="2.5" />
    <path d="M8.5 8.5h2.8M12.7 8.5h2.8" />
    <path d="M7 17.1 5.5 20M17 17.1 18.5 20" />
    <circle cx="9" cy="14" r="1" />
    <circle cx="15" cy="14" r="1" />
  </>,
);

export const IconWater = createCustomIcon(
  'IconWater',
  <>
    <path d="M6 6h12v8H6z" fill="currentColor" fillOpacity="0.16" stroke="none" />
    <path d="M6 14h12" />
    <path d="M8.2 14V8.8M12 14V7.6M15.8 14V8.8" />
    <path d="M4 18c1-.9 1.8-1.3 2.7-1.3 1.7 0 2.4 1.9 4.1 1.9.9 0 1.8-.4 2.7-1.3" />
    <path d="M10.5 20c1-.9 1.8-1.3 2.7-1.3 1.7 0 2.4 1.9 4.1 1.9.9 0 1.8-.4 2.7-1.3" />
  </>,
);

export const IconArrowDown = createCustomIcon(
  'IconArrowDown',
  <>
    <path d="M12 4v13" />
    <path d="m7.5 12.5 4.5 4.5 4.5-4.5" />
  </>,
);

export const IconActivity = createCustomIcon(
  'IconActivity',
  <>
    <path d="M3 12h3.2l2-4.2 3.2 8.4 2.2-5.2H21" />
  </>,
);

export const IconZap = createCustomIcon(
  'IconZap',
  <>
    <path d="M13.3 2 6.2 12.1h4.5L9.7 22l8.1-11.2h-4.5z" />
  </>,
);

export const IconDumbbell = createCustomIcon(
  'IconDumbbell',
  <>
    <path d="M3.5 10v4M6 9v6M18 9v6M20.5 10v4" />
    <path d="M6 12h12" />
  </>,
);

export const IconSun = createCustomIcon(
  'IconSun',
  <>
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.5 1.5M6.8 17.2l-1.5 1.5M18.7 18.7l-1.5-1.5M6.8 6.8 5.3 5.3" />
  </>,
);

export const IconDroplets = createCustomIcon(
  'IconDroplets',
  <>
    <path d="M12 3.2c2.7 3.4 4 5.7 4 7.6A4 4 0 1 1 8 10.8c0-1.9 1.3-4.2 4-7.6Z" />
    <path d="M6.2 8.2c1.5 1.8 2.2 3.1 2.2 4.1a2.2 2.2 0 1 1-4.4 0c0-1 .7-2.3 2.2-4.1Z" />
  </>,
);

export const IconSnowflake = createCustomIcon(
  'IconSnowflake',
  <>
    <path d="M12 2.8v18.4" />
    <path d="m7.4 5.2 9.2 13.6" />
    <path d="m16.6 5.2-9.2 13.6" />
    <path d="m9.8 4 2.2 1.2L14.2 4" />
    <path d="m9.8 20 2.2-1.2 2.2 1.2" />
  </>,
);

export const IconHazard = createCustomIcon(
  'IconHazard',
  <>
    <path d="M12 3 2.8 20.2h18.4L12 3Z" />
    <path d="M12 9v5.2" />
    <circle cx="12" cy="17" r="0.9" />
  </>,
);

export const IconPerson = createCustomIcon(
  'IconPerson',
  <>
    <circle cx="12" cy="7" r="3" />
    <path d="M6.5 21c.8-3.5 2.8-5.2 5.5-5.2S16.7 17.5 17.5 21" />
  </>,
);

export const IconCar = createCustomIcon(
  'IconCar',
  <>
    <path d="M4.5 14.5 6.2 9h11.6l1.7 5.5" />
    <rect x="3.5" y="12.5" width="17" height="5" rx="1.8" />
    <circle cx="7.2" cy="18" r="1.2" />
    <circle cx="16.8" cy="18" r="1.2" />
  </>,
);

export const IconBook = createCustomIcon(
  'IconBook',
  <>
    <path d="M4.2 5.5c2.2-1 4.2-1.1 6.2-.2v14.2c-2-1-4-.9-6.2.2V5.5Z" />
    <path d="M19.8 5.5c-2.2-1-4.2-1.1-6.2-.2v14.2c2-1 4-.9 6.2.2V5.5Z" />
  </>,
);

export const IconHand = createCustomIcon(
  'IconHand',
  <>
    <path d="M7.5 12V8.5a1.3 1.3 0 1 1 2.6 0V12" />
    <path d="M10.1 12V7.8a1.3 1.3 0 1 1 2.6 0V12" />
    <path d="M12.7 12V8.7a1.3 1.3 0 1 1 2.6 0V13" />
    <path d="M15.3 13v-.9a1.3 1.3 0 1 1 2.6 0v2.5c0 3.8-2.6 6.4-6.4 6.4H9.6c-1.6 0-2.6-.7-3.4-2.3l-1.7-3.3a1.2 1.2 0 1 1 2.1-1.2L8 16" />
  </>,
);

export const IconWeight = createCustomIcon(
  'IconWeight',
  <>
    <path d="M8.5 9.2h7" />
    <path d="M10 9.2a2 2 0 1 1 4 0" />
    <path d="M5.8 21h12.4L20 11.2H4L5.8 21Z" />
  </>,
);

export const IconShip = createCustomIcon(
  'IconShip',
  <>
    <path d="M12 3v7" />
    <path d="M12 5.5h4l-4 2.2" />
    <path d="M4 12.2h16l-1.8 5.3H5.8L4 12.2Z" />
    <path d="M3 19.2c1 .8 2 .8 3 0s2-.8 3 0 2 .8 3 0 2-.8 3 0 2 .8 3 0 2-.8 3 0" />
  </>,
);

export const IconLab = createCustomIcon(
  'IconLab',
  <>
    <path d="M9 3h6" />
    <path d="M10 3v4.5L4.8 18a2 2 0 0 0 1.8 3h10.8a2 2 0 0 0 1.8-3L14 7.5V3" />
    <path d="M8.2 14h7.6" />
  </>,
);

export const IconLandmark = createCustomIcon(
  'IconLandmark',
  <>
    <path d="m12 3-9 4h18l-9-4Z" />
    <path d="M5 7v8M9.5 7v8M14.5 7v8M19 7v8" />
    <path d="M3 15h18" />
    <path d="M2.5 21h19" />
  </>,
);

export const IconComparator = IconActivity;
export const IconSelector = IconLab;
export const IconScenario = IconHazard;
export const IconClasses = IconLayers;
export const IconMapSection = IconMap;
