import type { Subject } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface SubjectCardProps {
  subject: Subject;
}

export function SubjectCard({ subject }: SubjectCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-medium text-white">{subject.name}</h3>
          <p className="mt-1 text-sm text-zinc-500">Exam: {subject.examDate}</p>
        </div>
        <Badge variant="warning">Level {subject.confidence}/5</Badge>
      </div>
    </Card>
  );
}
