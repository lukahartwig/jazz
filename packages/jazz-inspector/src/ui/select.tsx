import { useId } from "react";
import { classNames } from "../utils.js";
import { Icon } from "./icon.js";

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    hideLabel?: boolean;
  },
) {
  const { label, hideLabel, id: customId, className } = props;
  const generatedId = useId();
  const id = customId || generatedId;

  const containerClassName = classNames("grid gap-1", className);

  const selectClassName = classNames(
    "w-full rounded-md border pl-3.5 py-2 pr-8 shadow-sm",
    "font-medium text-stone-900",
    "dark:text-white dark:bg-stone-925",
    "appearance-none",
    "truncate",
  );

  return (
    <div className={classNames(containerClassName)}>
      <label
        htmlFor={id}
        className={classNames("text-stone-600 dark:text-stone-300", {
          "sr-only": hideLabel,
        })}
      >
        {label}
      </label>

      <div className={classNames("relative flex items-center")}>
        <select {...props} id={id} className={selectClassName}>
          {props.children}
        </select>

        <Icon
          name="chevronDown"
          className={classNames(
            "absolute right-[0.5em] text-stone-400 dark:text-stone-600",
          )}
          size="sm"
        />
      </div>
    </div>
  );
}
