import clsx from "clsx";
import { Icon } from "../atoms/Icon";

export function BackToTopButton() {
  return (
    <button
      className={clsx(
        "md:hidden",
        "fixed bottom-4 right-4 z-30",
        "p-1.5 rounded-full border bg-white dark:bg-stone-950",
        "text-stone-800 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white",
        "hover:bg-stone-200 dark:hover:bg-stone-900",
        "transition-colors",
      )}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <span className="sr-only">Back to top</span>

      <Icon name="arrowUp" />
    </button>
  );
}
