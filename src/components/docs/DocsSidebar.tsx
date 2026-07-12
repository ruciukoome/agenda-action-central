import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { docsSections, docsGroups } from "./sections";

interface DocsSidebarProps {
  activeId: string;
  onNavigate?: () => void;
}

export function DocsSidebar({ activeId, onNavigate }: DocsSidebarProps) {
  return (
    <nav aria-label="Documentation" className="space-y-6 text-sm">
      {docsGroups.map((group) => {
        const items = docsSections.filter((s) => s.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group}
            </div>
            <ul className="space-y-0.5">
              {items.map((s) => {
                const Icon = s.icon;
                const active = s.id === activeId;
                return (
                  <li key={s.id}>
                    <NavLink
                      to={`/docs/${s.id}`}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors",
                        active
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground/70 hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{s.title}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function useActiveSection(): string {
  const { pathname } = useLocation();
  const [active, setActive] = useState<string>(() => {
    const fromPath = pathname.split("/docs/")[1];
    return fromPath || docsSections[0].id;
  });

  useEffect(() => {
    const fromPath = pathname.split("/docs/")[1];
    if (fromPath) {
      setActive(fromPath);
      const el = document.getElementById(`section-${fromPath}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [pathname]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const id = visible.target.id.replace("section-", "");
          setActive(id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    docsSections.forEach((s) => {
      const el = document.getElementById(`section-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return active;
}
