export default function ProgressIndicator({ currentStep }) {
  // Steps: 1=Tally, 2=Resolve, 3=Summary
  // Map to visual steps: 1, 2, 3, checkmark
  const steps = [1, 2, 3, '\u2713'];
  const stepMap = { 1: 1, 2: 2, 3: 4 }; // step 3 (summary) maps to visual step 4
  const current = stepMap[currentStep] || 1;

  return (
    <div className="flex justify-center items-center gap-0 pt-2.5 px-5 max-w-[600px] mx-auto">
      {steps.map((s, i) => {
        const stepNum = i + 1;
        let cls = 'w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 ';
        if (stepNum < current || currentStep === 3) {
          cls += 'bg-[var(--accent-green)] text-white';
        } else if (stepNum === current) {
          cls += 'bg-[var(--accent-blue)] text-white';
        } else {
          cls += 'bg-[rgba(148,163,184,0.15)] text-[var(--text-muted)]';
        }

        return (
          <div key={i} className="flex items-center gap-0">
            <div className={cls}>{s}</div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 flex-shrink-0 ${
                  stepNum < current || currentStep === 3
                    ? 'bg-[var(--accent-green)]'
                    : 'bg-[rgba(148,163,184,0.15)]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
