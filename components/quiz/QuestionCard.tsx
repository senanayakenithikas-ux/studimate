import type { QuizQuestion } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface QuestionCardProps {
  question: QuizQuestion;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onNext: () => void;
  isLast: boolean;
}

export function QuestionCard({
  question,
  selectedIndex,
  onSelect,
  onNext,
  isLast,
}: QuestionCardProps) {
  return (
    <Card title={question.question}>
      <ul className="space-y-2">
        {question.options.map((option, index) => (
          <li key={index}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                selectedIndex === index
                  ? "border-indigo-500 bg-indigo-600/20 text-white"
                  : "border-zinc-700 text-zinc-300 hover:border-zinc-600"
              }`}
            >
              {option}
            </button>
          </li>
        ))}
      </ul>
      <Button
        className="mt-4"
        disabled={selectedIndex === null}
        onClick={onNext}
      >
        {isLast ? "See results" : "Next question"}
      </Button>
    </Card>
  );
}
