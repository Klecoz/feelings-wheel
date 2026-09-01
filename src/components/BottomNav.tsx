import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/", label: "Wheel", end: true },
  { to: "/history", label: "History", end: false },
  { to: "/summary", label: "Summary", end: false },
  { to: "/settings", label: "Settings", end: false },
];

export function BottomNav() {
  return (
    <nav
      className="shrink-0 border-t border-[var(--color-line)] bg-[var(--color-surface)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex w-full max-w-lg">
        {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            [
              "flex min-h-14 flex-1 items-center justify-center text-[13px] font-medium",
              isActive
                ? "text-[var(--color-accent)]"
                : "text-[var(--color-ink-faint)]",
            ].join(" ")
          }
        >
          {tab.label}
        </NavLink>
        ))}
      </div>
    </nav>
  );
}
