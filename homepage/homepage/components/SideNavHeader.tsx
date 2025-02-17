import Link from "next/link";

export function SideNavHeader({
  href,
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) {
  const className =
    "block px-2 font-medium text-stone-900 py-1 dark:text-white mb-1";

  if (href) {
    return (
      <Link className={className} href={href}>
        {children}
      </Link>
    );
  }

  return <p className={className}>{children}</p>;
}
