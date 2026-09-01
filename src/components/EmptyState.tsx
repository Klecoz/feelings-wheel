import { Link } from "react-router-dom";

/**
 * Empty screens are the first thing a new user meets on each tab, and a bare
 * line of grey text in a void reads as something broken. Say what will appear
 * here and why, and offer the way to start — without turning it into a tutorial.
 */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { to: string; label: string };
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-8 pb-16">
      <div className="max-w-xs text-center">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">{body}</p>
        {action && (
          <Link
            to={action.to}
            className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-accent)]"
          >
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}
