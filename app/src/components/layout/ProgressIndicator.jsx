export default function ProgressIndicator({ currentStep }) {
  // Steps: 1=Count, 2=Check, 3=Done
  const steps = [
    { num: 1, label: 'Count' },
    { num: 2, label: 'Check' },
    { num: 3, label: 'Done' },
  ];

  return (
    <div className="pt-3 px-5 max-w-[600px] mx-auto">
      <div className="flex justify-center items-start gap-0" role="progressbar" aria-valuemin="1" aria-valuemax="3" aria-valuenow={currentStep}>
        {steps.map((s, i) => {
          const isComplete = s.num < currentStep;
          const isCurrent = s.num === currentStep;
          let circleCls = 'w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 transition-colors ';
          let labelCls = 'text-[11px] mt-1 font-semibold transition-colors ';
          if (isComplete) {
            circleCls += 'bg-[var(--accent-green)] text-white';
            labelCls += 'text-[var(--accent-green)]';
          } else if (isCurrent) {
            circleCls += 'bg-[var(--accent-blue)] text-white';
            labelCls += 'text-[var(--accent-blue-light)]';
          } else {
            circleCls += 'bg-[rgba(148,163,184,0.15)] text-[var(--text-muted)]';
            labelCls += 'text-[var(--text-muted)]';
          }

          return (
            <div key={s.num} className="flex items-start gap-0">
              <div className="flex flex-col items-center">
                <div className={circleCls} aria-label={`Step ${s.num}: ${s.label}`}>
                  {isComplete ? '\u2713' : s.num}
                </div>
                <div className={labelCls}>{s.label}</div>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-0.5 w-10 flex-shrink-0 mt-4 mx-1 ${
                    s.num < currentStep
                      ? 'bg-[var(--accent-green)]'
                      : 'bg-[rgba(148,163,184,0.15)]'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
