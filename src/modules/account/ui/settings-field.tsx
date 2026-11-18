import { type ReactNode, useId } from 'react';

type ControlLabels = {
  'aria-labelledby': string;
  'aria-describedby'?: string;
};

type SettingsFieldProps = {
  label: string;
  description?: string;
  children: (labels: ControlLabels) => ReactNode;
};

export function SettingsField({
  label,
  description,
  children,
}: SettingsFieldProps) {
  const labelId = useId();
  const descriptionId = useId();

  return (
    <div className="flex items-center justify-between gap-4 border-b py-4 last:border-b-0">
      <div className="grid min-w-0 flex-1 gap-0.5">
        <span id={labelId} className="text-sm font-semibold">
          {label}
        </span>
        {description && (
          <span id={descriptionId} className="text-xs text-muted-foreground">
            {description}
          </span>
        )}
      </div>
      {children(
        description
          ? { 'aria-labelledby': labelId, 'aria-describedby': descriptionId }
          : { 'aria-labelledby': labelId },
      )}
    </div>
  );
}
