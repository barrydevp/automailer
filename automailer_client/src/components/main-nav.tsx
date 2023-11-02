import { Link, usePathname } from "@/components/shared/router";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/ui/icons";

export type MainNavItemProps = {
  href: string;
  name: string;
  external?: boolean;
  className?: string;
  children?: React.ReactNode;
};

function MainNavItem({
  pathname,
  href,
  name,
  external,
  className,
  children,
}: MainNavItemProps & { pathname?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "transition-colors hover:text-foreground/80",
        !external && pathname?.startsWith(href)
          ? "text-foreground"
          : "text-foreground/60",
        className ?? "",
      )}
    >
      {name}
      {children}
    </Link>
  );
}

export interface MainNavProps {
  items: MainNavItemProps[];
}

export function MainNav({ items }: MainNavProps) {
  const pathname = usePathname();

  return (
    <div className="mr-4 hidden md:flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <Icons.logo className="h-6 w-6" />
        <span className="hidden font-bold sm:inline-block">
          {siteConfig.name}
        </span>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        {items.map((item) => (
          <MainNavItem key={item.name} pathname={pathname} {...item} />
        ))}
      </nav>
    </div>
  );
}
