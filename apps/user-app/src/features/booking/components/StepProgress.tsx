import { cn } from "@/shared/lib/utils";
import { Check } from "lucide-react";

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

const StepProgress = ({ currentStep, totalSteps, labels }: StepProgressProps) => {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: totalSteps }, (_, index) => {
          const step = index + 1;
          const isCompleted = step < currentStep;
          const isActive = step === currentStep;

          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  isCompleted && "bg-[#FF10F0] md:bg-primary text-white",
                  isActive && "bg-[#FF10F0] md:bg-primary text-white ring-4 ring-[#FF10F0]/20 md:ring-primary/20",
                  !isCompleted && !isActive && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : step}
              </div>
              {step < totalSteps && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-1 rounded-full transition-all",
                    isCompleted ? "bg-[#FF10F0] md:bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground text-center">{labels[currentStep - 1]}</p>
    </div>
  );
};

export default StepProgress;
