import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "solaraudit.nav.collapsed";

function readCollapsed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((v): v is string => typeof v === "string"));
    }
    return new Set();
  } catch {
    return new Set();
  }
}

export interface UseCollapsibleGroupsReturn {
  readonly collapsed: ReadonlySet<string>;
  readonly isCollapsed: (label: string) => boolean;
  readonly toggle: (label: string) => void;
  readonly expandAll: () => void;
  readonly collapseAll: (labels: readonly string[]) => void;
}

export function useCollapsibleGroups(): UseCollapsibleGroupsReturn {
  const [collapsed, setCollapsed] = useState<Set<string>>(() =>
    readCollapsed(),
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(Array.from(collapsed)),
      );
    } catch {
      // Ignore storage failures (private mode, quota, etc.)
    }
  }, [collapsed]);

  const isCollapsed = useCallback(
    (label: string) => collapsed.has(label),
    [collapsed],
  );

  const toggle = useCallback((label: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => setCollapsed(new Set()), []);

  const collapseAll = useCallback((labels: readonly string[]) => {
    setCollapsed(new Set(labels));
  }, []);

  return { collapsed, isCollapsed, toggle, expandAll, collapseAll };
}