import { jsonError, jsonOk, requireAuth } from "@/lib/api";
import { getAuthedSupabase } from "@/lib/supabase-server";
import { hasDuplicateSubjectName } from "@/lib/subjects";
import type { Subject } from "@/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface SubjectRow {
  id: string;
  name: string;
  exam_date: string;
  confidence_level: number;
}

function rowToSubject(row: SubjectRow): Subject {
  const examDate =
    typeof row.exam_date === "string"
      ? row.exam_date.slice(0, 10)
      : String(row.exam_date);

  return {
    id: row.id,
    name: row.name,
    examDate,
    confidence: row.confidence_level,
  };
}

function parseCreateBody(
  body: Partial<Omit<Subject, "id">>,
):
  | { ok: true; name: string; examDate: string; confidence: number }
  | { ok: false; message: string } {
  const name = body.name?.trim();
  if (!name) {
    return { ok: false, message: "Subject name is required" };
  }

  const examDate = body.examDate?.trim();
  if (!examDate || !DATE_RE.test(examDate)) {
    return { ok: false, message: "Valid examDate (YYYY-MM-DD) is required" };
  }

  const confidence = body.confidence ?? 3;
  if (!Number.isInteger(confidence) || confidence < 1 || confidence > 10) {
    return {
      ok: false,
      message: "confidence must be an integer between 1 and 10",
    };
  }

  return { ok: true, name, examDate, confidence };
}

export async function GET(request: Request) {
  const token = requireAuth(request);
  if (!token) {
    return jsonError("Unauthorized", 401);
  }

  const ctx = await getAuthedSupabase(token);
  if (!ctx) {
    return jsonError("Unauthorized", 401);
  }

  const { supabase, userId } = ctx;

  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, exam_date, confidence_level")
    .eq("user_id", userId)
    .order("exam_date", { ascending: true });

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonOk((data ?? []).map((row) => rowToSubject(row as SubjectRow)));
}

export async function POST(request: Request) {
  const token = requireAuth(request);
  if (!token) {
    return jsonError("Unauthorized", 401);
  }

  const ctx = await getAuthedSupabase(token);
  if (!ctx) {
    return jsonError("Unauthorized", 401);
  }

  const { supabase, userId } = ctx;

  let body: Partial<Omit<Subject, "id">>;
  try {
    body = (await request.json()) as Partial<Omit<Subject, "id">>;
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const parsed = parseCreateBody(body);
  if (!parsed.ok) {
    return jsonError(parsed.message);
  }

  const { data: existingSubjects, error: existingError } = await supabase
    .from("subjects")
    .select("name")
    .eq("user_id", userId);

  if (existingError) {
    return jsonError(existingError.message, 500);
  }

  if (hasDuplicateSubjectName(parsed.name, existingSubjects ?? [])) {
    return jsonError("You already have a subject with this name", 409);
  }

  const { data, error } = await supabase
    .from("subjects")
    .insert({
      user_id: userId,
      name: parsed.name,
      exam_date: parsed.examDate,
      confidence_level: parsed.confidence,
    })
    .select("id, name, exam_date, confidence_level")
    .single();

  if (error) {
    if (error.code === "23505") {
      return jsonError("You already have a subject with this name", 409);
    }
    return jsonError(error.message, 500);
  }

  return jsonOk(rowToSubject(data as SubjectRow), 201);
}
