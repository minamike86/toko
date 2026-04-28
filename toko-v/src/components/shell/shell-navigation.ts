export type NavigationKind = "link" | "placeholder";

export interface NavigationItem {
  label: string;
  href?: string;
  kind: NavigationKind;
  isActive: (pathname: string) => boolean;
}

export const shellNavigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    kind: "link",
    isActive: (pathname: string) =>
      pathname === "/" || pathname.startsWith("/dashboard"),
  },
  {
    label: "Sales",
    href: "/pos",
    kind: "link",
    isActive: (pathname: string) => pathname.startsWith("/pos"),
  },
  {
    label: "Inventory",
    href: "/inventory",
    kind: "link",
    isActive: (pathname: string) => pathname.startsWith("/inventory"),
  },
  {
    label: "Procurement",
    kind: "placeholder",
    isActive: (pathname: string) => pathname.startsWith("/procurement"),
  },
  {
    label: "System",
    href: "/admin/system",
    kind: "link",
    isActive: (pathname: string) => pathname.startsWith("/admin/system"),
  },
];

export function shouldUseOperationalShell(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/pos") ||
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/procurement") ||
    pathname.startsWith("/admin/system")
  );
}

export function resolvePageTitle(pathname: string): string {
  if (pathname === "/" || pathname.startsWith("/dashboard")) {
    return "Dashboard";
  }

  if (pathname.startsWith("/pos")) {
    return "Sales";
  }

  if (pathname.startsWith("/inventory")) {
    return "Inventory";
  }

  if (pathname.startsWith("/procurement")) {
    return "Procurement";
  }

  if (pathname.startsWith("/admin/system")) {
    return "System";
  }

  return "Operasional";
}

export function itemInitial(label: string): string {
  return label.slice(0, 1).toUpperCase();
}