/** Row shape from `public.subjects`. */
export interface DbSubject {
  id: string;
  user_id: string;
  name: string;
}

/** Row shape from `public.schedules` with joined subject name. */
export interface ScheduleWithSubject {
  id: string;
  user_id: string;
  subject_id: string;
  date: string;
  duration_mins: number;
  topics: string;
  completed: boolean;
  subjects: { name: string } | { name: string }[] | null;
}

export interface CreateScheduleInput {
  subjectId: string;
  topics: string;
  durationMins: number;
  date: string;
}

export interface CreateSubjectInput {
  name: string;
}
