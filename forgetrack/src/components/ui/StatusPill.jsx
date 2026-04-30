import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const pillStyles = {
  success: 'bg-success-bg text-success border-success-border',
  danger: 'bg-danger-bg text-danger border-danger-border',
  warning: 'bg-warning-bg text-warning border-warning-border',
  info: 'bg-info-bg text-info border-info-border',
  neutral: 'bg-surface-raised text-fg-secondary border-border',
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

export function StatusPill({
  children,
  variant = 'neutral',
  trend,
  icon: CustomIcon,
  className = '',
}) {
  const TrendIcon = trend ? trendIcons[trend] : null;
  const Icon = CustomIcon || TrendIcon;

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2.5 py-1
        rounded-full text-micro uppercase font-semibold
        border font-tabular
        ${pillStyles[variant]}
        ${className}
      `}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}

// Convenience wrappers
export function PresentPill() {
  return <StatusPill variant="success">Present</StatusPill>;
}

export function AbsentPill() {
  return <StatusPill variant="danger">Absent</StatusPill>;
}

export function AttendancePill({ present }) {
  return present ? <PresentPill /> : <AbsentPill />;
}
