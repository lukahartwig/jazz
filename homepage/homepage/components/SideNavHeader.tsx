import Link from "next/link";
import {clsx} from "clsx";

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
    "block font-medium text-stone-900 py-1 dark:text-white mb-1  [&:not(:first-child)]:mt-4",
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
