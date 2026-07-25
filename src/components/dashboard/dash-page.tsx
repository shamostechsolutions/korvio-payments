import { cn } from "@/lib/utils/cn";

export function DashPageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--dash-ink)] md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-[var(--dash-muted)]">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function DashCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("dash-card p-5 md:p-6", className)}>{children}</div>;
}

export function DashTableWrap({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("dash-card overflow-x-auto", className)}>
      <table className="dash-table min-w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function DashMessage({
  type = "info",
  children,
}: {
  type?: "info" | "success" | "error";
  children: React.ReactNode;
}) {
  const colors =
    type === "success"
      ? "text-emerald-400"
      : type === "error"
        ? "text-red-400"
        : "text-teal-400";
  return <p className={cn("text-sm", colors)}>{children}</p>;
}

export function DashBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400">
      {children}
    </span>
  );
}
