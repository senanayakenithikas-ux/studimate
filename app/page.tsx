import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-zinc-950 px-6 py-16 text-center">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Studimate
        </h1>
        <p className="mt-3 max-w-md text-zinc-400">
          AI-powered study planner, quizzes, and tutor for your exam prep.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/login">
          <Button>Log in</Button>
        </Link>
        <Link href="/signup">
          <Button variant="secondary">Sign up</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost">Dashboard</Button>
        </Link>
      </div>
    </main>
  );
}
