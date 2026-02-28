type ThemeMode = 'light' | 'dark';

interface GradeLogoProps {
  themeMode: ThemeMode;
  className?: string;
}

export function GradeLogo({ themeMode, className = '' }: GradeLogoProps) {
  const wordColorClass = themeMode === 'dark' ? 'text-slate-100' : 'text-slate-900';

  return (
    <div className={`inline-flex items-center justify-center ${wordColorClass} ${className}`}>
      <span className="inline-flex h-9 items-center text-[1.72rem] font-black leading-none tracking-[-0.035em] md:h-10 md:text-[1.86rem]">
        GRADE
      </span>
    </div>
  );
}
