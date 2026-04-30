export function ProgressBar({ progress = 0, className = '', height = 'h-2', color = 'bg-accent-glow' }) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className={`w-full ${height} bg-surface-inset rounded-full overflow-hidden ${className}`}>
      <div 
        className={`h-full ${color} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${clampedProgress}%` }}
      />
    </div>
  );
}
