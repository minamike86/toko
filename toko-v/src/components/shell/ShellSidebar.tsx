"use client";

import Link from "next/link";
import {
  itemInitial,
  shellNavigationItems,
} from "@/components/shell/shell-navigation";

interface ShellSidebarProps {
  pathname: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

function navigationClassName(active: boolean, isCollapsed: boolean): string {
  const baseClassName =
    "flex items-center rounded-xl border text-sm font-medium transition";
  const activeClassName =
    "border-slate-900 bg-slate-900 text-white shadow-sm";
  const inactiveClassName =
    "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900";
  const layoutClassName = isCollapsed
    ? "justify-center px-2 py-3"
    : "justify-between px-3 py-2";

  return `${baseClassName} ${layoutClassName} ${active ? activeClassName : inactiveClassName
    }`;
}

export function ShellSidebar({
  pathname,
  isCollapsed,
  onToggleCollapse,
}: ShellSidebarProps) {
  return (
    <aside
      className={`border-r border-slate-200 bg-slate-100/80 transition-all ${isCollapsed ? "w-20" : "w-72"
        }`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <div className={isCollapsed ? "hidden" : "block"}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Sistem Jual Beli Terpadu
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Shell operasional minimal
            </p>
          </div>

          <button
            type="button"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            onClick={onToggleCollapse}
          >
            {isCollapsed ? "›" : "‹"}
          </button>
        </div>

        <nav className="flex-1 space-y-2 px-3 py-4">
          {shellNavigationItems.map((item) => {
            const active = item.isActive(pathname);
            const initial = itemInitial(item.label);

            const content = (
              <>
                <span
                  aria-hidden="true"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/15 text-xs font-semibold"
                >
                  {initial}
                </span>

                {!isCollapsed ? (
                  <span className="ml-3 flex-1">{item.label}</span>
                ) : null}
              </>
            );

            if (item.kind === "placeholder") {
              return (
                <div
                  key={item.label}
                  aria-current={active ? "page" : undefined}
                  className={navigationClassName(active, isCollapsed)}
                  title={item.label}
                >
                  {content}
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href ?? "#"}
                aria-current={active ? "page" : undefined}
                aria-label={isCollapsed ? initial : item.label}
                className={navigationClassName(active, isCollapsed)}
                title={item.label}
              >
                {content}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 px-4 py-4">
          <p className={`text-xs text-slate-500 ${isCollapsed ? "hidden" : "block"}`}>
            Navigasi ini murni presentational.
          </p>
        </div>
      </div>
    </aside>
  );
}