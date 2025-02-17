import clsx from "clsx";

export function Kicker({
  children,
  className,
  as,
}: React.ComponentPropsWithoutRef<"p"> & {
  as?: React.ElementType;
}) {
  const Element = as ?? "p";
  return (
    <Element
      className={clsx(
        className,
        "uppercase font-mono text-blue tracking-widest text-sm font-semibold dark:text-stone-400",
      )}
    >
      {children}
    </Element>
  );
}
