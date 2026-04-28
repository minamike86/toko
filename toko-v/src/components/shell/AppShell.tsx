"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { ShellFloatingToggle } from "@/components/shell/ShellFloatingToggle";
import { ShellHeader } from "@/components/shell/ShellHeader";
import { ShellSidebar } from "@/components/shell/ShellSidebar";
import {
  resolvePageTitle,
  shouldUseOperationalShell,
} from "@/components/shell/shell-navigation";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  if (!shouldUseOperationalShell(pathname)) {
    return <>{children}</>;
  }

  const pageTitle = resolvePageTitle(pathname);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <ShellFloatingToggle
          isSidebarHidden={isSidebarHidden}
          onToggle={() => setIsSidebarHidden((current) => !current)}
        />

        {!isSidebarHidden ? (
          <ShellSidebar
            pathname={pathname}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() =>
              setIsSidebarCollapsed((current) => !current)
            }
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <ShellHeader
            pageTitle={pageTitle}
            hasSidebar={!isSidebarHidden}
          />

          <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}