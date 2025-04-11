import { clsx } from "clsx";
import Link from "next/link";

export function SideNavHeader({
  href,
  children,
  className,
}: {
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const classes = clsx(
    className,
    "flex items-center gap-2 justify-between font-medium text-stone-900 py-1 dark:text-white mb-1 [&:not(:first-child)]:mt-4",
  );
  if (href) {
    return (
      <Link className={classes} href={href}>
        {children}
      </Link>
    );
  }

  return <p className={classes}>{children}</p>;
}
