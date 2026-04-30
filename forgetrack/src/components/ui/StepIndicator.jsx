import { Check } from 'lucide-react';

export function StepIndicator({ steps, currentStep, className = '' }) {
  return (
    <div className={`flex items-center w-full max-w-3xl mx-auto ${className}`}>
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isCompleted = currentStep > stepNum;
        const isActive = currentStep === stepNum;
        const isPending = currentStep < stepNum;

        return (
          <div key={step.id || index} className="flex-1 flex items-center relative">
            <div className="flex flex-col items-center gap-2 relative z-10">
              <div 
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-body font-semibold transition-colors duration-300
                  ${isCompleted ? 'bg-success text-void border-none' : ''}
                  ${isActive ? 'bg-accent-glow text-fg-primary border-none shadow-focus' : ''}
                  ${isPending ? 'bg-surface-raised text-fg-tertiary border border-border' : ''}
                `}
              >
                {isCompleted ? <Check className="w-4 h-4" strokeWidth={3} /> : stepNum}
              </div>
              <span 
                className={`
                  text-caption absolute top-10 whitespace-nowrap transition-colors duration-300
                  ${isCompleted || isActive ? 'text-fg-primary' : 'text-fg-tertiary'}
                `}
              >
                {step.label}
              </span>
            </div>
            
            {/* Connecting line */}
            {index < steps.length - 1 && (
              <div className="absolute top-4 left-1/2 w-full h-[2px] bg-border -z-10">
                <div 
                  className="h-full bg-success transition-all duration-500 ease-out"
                  style={{ width: isCompleted ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
