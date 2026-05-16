import type { QuizResult } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface ResultsViewProps {
  result: QuizResult;
}

export function ResultsView({ result }: ResultsViewProps) {
  const percent = Math.round((result.score / result.total) * 100);

  return (
    <Card title="Quiz results">
      <div className="mb-4 flex items-center gap-3">
        <p className="text-3xl font-bold text-white">
          {result.score}/{result.total}
        </p>
        <Badge variant={percent >= 70 ? "success" : "warning"}>
          {percent}%
        </Badge>
      </div>
      <ul className="space-y-2 text-sm text-zinc-400">
        {result.questions.map((q, i) => (
          <li key={q.id}>
            {q.question} —{" "}
            {result.answers[i] === q.correctIndex ? "Correct" : "Incorrect"}
          </li>
        ))}
      </ul>
    </Card>
  );
}
