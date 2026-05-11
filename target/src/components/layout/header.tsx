"use client";

import { usePathname } from "next/navigation";
import { Search, Bell } from "lucide-react";

function getPageTitle(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (!segment) return "Dashboard";
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function Header() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Breadcrumb / Page title */}
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Search trigger (Cmd+K) */}
        <button
          type="button"
          className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100"
        >
          <Search className="h-4 w-4" />
          <span>Search...</span>
          <kbd className="ml-2 rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs font-medium text-gray-400">
            &#8984;K
          </kbd>
        </button>

        {/* Notifications placeholder */}
        <button
          type="button"
          className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <Bell className="h-5 w-5" />
        </button>

        {/* User avatar placeholder */}
        <div className="h-8 w-8 rounded-full bg-gray-300" />
      </div>
    </header>
  );
}
