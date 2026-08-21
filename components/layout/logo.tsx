import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="group flex min-h-11 items-center gap-3 rounded-card px-1 text-ink"
      aria-label="Adaptiva home"
    >
      <span className="relative grid size-10 place-items-center overflow-hidden rounded-card border border-ink/10 bg-white shadow-soft">
        <span className="absolute h-12 w-4 -rotate-12 rounded-full bg-mint" />
        <span className="absolute h-12 w-4 rotate-12 rounded-full bg-coral" />
        <span className="absolute bottom-2 h-2 w-5 rounded-full bg-amber" />
      </span>
      <span className="leading-none">
        <span className="block text-base font-black tracking-[0.12em]">ADAPTIVA</span>
        <span className="block text-[0.7rem] font-semibold text-graphite">
          Adaptive learning
        </span>
      </span>
    </Link>
  );
}
