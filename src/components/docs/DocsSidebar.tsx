import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { docsSections, docsGroups } from "./sections";

interface DocsSidebarProps {
  activeId: string;
  onNavigate?: (id: string) => void;
}

export function DocsSidebar({ activeId, onNavigate }: DocsSidebarProps) {
  return (
    <nav aria-label="Documentation" className="space-y-7 text-[13px]">
      {docsGroups.map((group) => {
        const items = docsSections.filter((s) => s.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
              {group}
            </div>
            <ul className="space-y-px">
              {items.map((s) => {
                const Icon = s.icon;
                const active = s.id === activeId;
                return (
                  <li key={s.id}>
                    <NavLink
                      to={`/docs/${s.id}`}
                      onClick={() => onNavigate?.(s.id)}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 transition-colors",
                        active
                          ? "text-brand font-medium bg-brand/5"
                          : "text-foreground/65 hover:text-foreground hover:bg-muted/60",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full transition-colors",
                          active ? "bg-brand" : "bg-transparent",
                        )}
                        aria-hidden
                      />
                      <Icon
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 transition-colors",
                          active ? "text-brand" : "text-muted-foreground group-hover:text-foreground",
                        )}
                      />
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

export function useActiveSection() {
  const { pathname } = useLocation();
  const [active, setActive] = useState<string>(() => {
    const fromPath = pathname.split("/docs/")[1];
    return fromPath || docsSections[0].id;
  });
  const lockRef = useRef(false);
  const lockTimer = useRef<number | null>(null);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(`section-${id}`);
    if (!el) return;
    lockRef.current = true;
    if (lockTimer.current) window.clearTimeout(lockTimer.current);
    setActive(id);
    const y = el.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top: y, behavior: "smooth" });
    lockTimer.current = window.setTimeout(() => {
      lockRef.current = false;
    }, 800);
  };

  useEffect(() => {
    const fromPath = pathname.split("/docs/")[1];
    if (fromPath) scrollToSection(fromPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (lockRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const id = visible.target.id.replace("section-", "");
          setActive(id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    docsSections.forEach((s) => {
      const el = document.getElementById(`section-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return { active, scrollToSection };
}

interface OnThisPageProps {
  activeId: string;
  onNavigate: (id: string) => void;
}

export function OnThisPage({ activeId, onNavigate }: OnThisPageProps) {
  return (
    <div className="text-[13px]">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
        On this page
      </div>
      <ul className="space-y-1 border-l border-border/70">
        {docsSections.map((s) => {
          const active = s.id === activeId;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onNavigate(s.id)}
                className={cn(
                  "block w-full text-left -ml-px border-l-2 pl-3 py-1 transition-colors",
                  active
                    ? "border-brand text-brand font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {s.title}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
