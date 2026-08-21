import { ArrowRight, Building2, GraduationCap, HeartPulse, Landmark, ShieldCheck, Workflow } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Panel, SectionHeader } from "@/components/ui/panel";

const domains = [
  { label: "Education", icon: GraduationCap },
  { label: "Healthcare", icon: HeartPulse },
  { label: "Banking", icon: ShieldCheck },
  { label: "Government services", icon: Landmark },
  { label: "Workplace tools", icon: Building2 },
  { label: "Public information", icon: Workflow }
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Impact"
        title="Digital accessibility is often treated as a feature. Adaptiva makes it the foundation."
        body="Students should not have to adapt to technology. Technology should adapt to the student."
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="text-3xl font-black text-ink">The problem</h2>
          <p className="mt-4 text-lg leading-9 text-graphite">
            Digital learning often presents the same dense page, fast lecture, and complex vocabulary to every learner. That creates barriers for people with reading, comprehension, attention, language, visual, motor, and digital-literacy needs.
          </p>
        </Panel>
        <Panel>
          <h2 className="text-3xl font-black text-ink">Adaptiva&apos;s approach</h2>
          <p className="mt-4 text-lg leading-9 text-graphite">
            Adaptiva transforms the content layer itself: easier to read, understand, hear, focus on, navigate, translate, and remember.
          </p>
        </Panel>
      </div>
      <section className="mt-10">
        <h2 className="text-3xl font-black text-ink">Future domains</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {domains.map((domain) => {
            const Icon = domain.icon;
            return (
              <Panel key={domain.label}>
                <Icon aria-hidden="true" className="text-moss" size={30} />
                <p className="mt-4 text-xl font-black text-ink">{domain.label}</p>
              </Panel>
            );
          })}
        </div>
      </section>
      <Button className="mt-8" asChild>
        <Link href="/architecture">
          View system architecture
          <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </Button>
    </div>
  );
}
