import { BookOpen, FileAudio, FileUp, PenLine, Send, Users } from "lucide-react";
import Link from "next/link";
import { TeacherInsightChart } from "@/components/charts/learning-charts";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

const tools = [
  { label: "Upload learning material", icon: FileUp },
  { label: "Generate accessible version", icon: BookOpen },
  { label: "Generate audio", icon: FileAudio },
  { label: "Create quizzes", icon: PenLine },
  { label: "Publish accessible material", icon: Send }
];

export default function TeacherPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Teacher Dashboard</p>
      <h1 className="mt-4 text-5xl font-black text-ink">Create accessible material once.</h1>
      <p className="mt-3 max-w-3xl text-xl leading-8 text-graphite">
        Adaptiva prepares simplified notes, audio, concept maps, quizzes, and difficult-concept insights.
      </p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.label}
              href="/learn"
              className="min-h-40 rounded-card border border-ink/10 bg-white p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-moss/40"
            >
              <Icon aria-hidden="true" className="text-moss" size={28} />
              <span className="mt-5 block font-black text-ink">{tool.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel>
          <Users aria-hidden="true" className="text-moss" size={32} />
          <h2 className="mt-4 text-3xl font-black text-ink">128 students</h2>
          <p className="mt-3 text-sm leading-7 text-graphite">
            Accessibility preferences are treated as user settings, not diagnoses.
          </p>
          <Button className="mt-5" asChild>
            <Link href="/learn">Generate class adaptation</Link>
          </Button>
        </Panel>
        <Panel>
          <h2 className="text-2xl font-black text-ink">Most requested explanations</h2>
          <div className="mt-4">
            <TeacherInsightChart />
          </div>
        </Panel>
      </div>
    </div>
  );
}
