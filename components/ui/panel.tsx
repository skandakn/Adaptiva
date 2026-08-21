import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
  as: Component = "section"
}: {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "article" | "aside" | "div";
}) {
  return (
    <Component
      className={cn("rounded-card border border-ink/10 bg-white p-5 shadow-soft", className)}
    >
      {children}
    </Component>
  );
}

export function Badge({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center rounded-card border border-ink/10 bg-cloud px-3 text-xs font-black uppercase tracking-[0.14em] text-moss",
        className
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  body,
  className
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      {eyebrow ? <Badge>{eyebrow}</Badge> : null}
      <h2 className="mt-4 text-balance text-3xl font-black leading-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {body ? <p className="mt-4 text-lg leading-8 text-graphite">{body}</p> : null}
    </div>
  );
}
