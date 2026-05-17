import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Calendar,
  MessageSquare,
  Sparkles,
  Upload,
} from "lucide-react";

const features = [
  {
    title: "Smart planner",
    description:
      "AI builds a weekly schedule around your exams, confidence, and available hours.",
    icon: Calendar,
  },
  {
    title: "Adaptive quizzes",
    description:
      "Practice with questions generated from your own materials and track weak spots.",
    icon: Brain,
  },
  {
    title: "Personal tutor",
    description:
      "Ask follow-up questions and get explanations grounded in what you uploaded.",
    icon: MessageSquare,
  },
  {
    title: "Your materials",
    description:
      "Upload notes and syllabi so every plan and quiz stays relevant to your classes.",
    icon: Upload,
  },
] as const;

interface HomeLandingProps {
  isAuthenticated?: boolean;
}

export function HomeLanding({ isAuthenticated = false }: HomeLandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Studimate
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <>
                <Button
                  asChild
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                >
                  <Link href="/dashboard">Open dashboard</Link>
                </Button>
                <SignOutButton label="Sign out" />
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button
                  asChild
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                >
                  <Link href="/signup">Get started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300 mb-8">
            <Sparkles className="w-4 h-4" />
            AI-powered study assistant
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground max-w-4xl mx-auto">
            Plan smarter. Learn faster.{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Ace your exams.
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Your intelligent study companion — personalized schedules, quizzes,
            and tutoring built around the subjects you are actually taking.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isAuthenticated ? (
              <>
                <Button
                  asChild
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg h-12 px-8"
                >
                  <Link href="/dashboard">Continue to dashboard</Link>
                </Button>
                <SignOutButton
                  label="Sign out"
                  className="h-12 px-4 flex items-center"
                />
              </>
            ) : (
              <>
                <Button
                  asChild
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg h-12 px-8"
                >
                  <Link href="/signup">Create free account</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-border bg-transparent hover:bg-white/5 rounded-lg h-12 px-8"
                >
                  <Link href="/login">I already have an account</Link>
                </Button>
              </>
            )}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 pb-20 md:pb-28">
          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="rounded-xl border border-border bg-card/80 p-6 text-left shadow-lg shadow-black/20"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {feature.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-muted-foreground">
        <p>Studimate — built for students who want structure without the stress.</p>
      </footer>
    </div>
  );
}
