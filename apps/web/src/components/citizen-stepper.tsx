'use client';

type CitizenStepperProps = {
  steps: string[];
  currentStep: number;
};

export function CitizenStepper({ steps, currentStep }: CitizenStepperProps) {
  return (
    <nav className="citizen-stepper" aria-label="Progresso do formulário">
      <ol className="citizen-stepper__list">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isDone = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          return (
            <li
              key={label}
              className={`citizen-stepper__item${isDone ? ' is-done' : ''}${isActive ? ' is-active' : ''}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="citizen-stepper__dot" aria-hidden>
                {isDone ? '✓' : stepNumber}
              </span>
              <span className="citizen-stepper__label">{label}</span>
            </li>
          );
        })}
      </ol>
      <div className="citizen-stepper__bar" aria-hidden>
        <span
          className="citizen-stepper__bar-fill"
          style={{ width: `${((currentStep - 1) / Math.max(steps.length - 1, 1)) * 100}%` }}
        />
      </div>
    </nav>
  );
}
