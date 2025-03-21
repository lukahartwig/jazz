import { forwardRef, useId } from "react";

import { classNames } from "../utils.js";
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // label can be hidden with a "label:sr-only" className
  label: string;
  className?: string;
  id?: string;
  hideLabel?: boolean;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, hideLabel, id: customId, ...inputProps }, ref) => {
    const generatedId = useId();
    const id = customId || generatedId;

    const inputClassName = classNames(
      "w-full rounded-md border px-3.5 py-2 shadow-sm",
      "font-medium text-stone-900",
      "dark:text-white dark:bg-stone-925",
    );

    const containerClassName = classNames("grid gap-1", className);

    return (
      <div className={containerClassName}>
        <label
          htmlFor={id}
          className={classNames(
            "text-stone-600 dark:text-stone-300",
            hideLabel && "sr-only",
          )}
        >
          {label}
        </label>

        <input ref={ref} {...inputProps} id={id} className={inputClassName} />
      </div>
    );
  },
);
