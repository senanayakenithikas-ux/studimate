import type { SupabaseClient } from "@supabase/supabase-js";
import {
  deleteStudyMaterialById,
  STUDY_MATERIALS_BUCKET,
} from "@/lib/study-material-storage";

export type DeleteUserAccountResult =
  | { ok: true; userId: string }
  | { ok: false; message: string; status: number };

async function removeUserStoragePrefix(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: files, error: listError } = await supabase.storage
    .from(STUDY_MATERIALS_BUCKET)
    .list(userId, { limit: 1000 });

  if (listError) {
    return listError.message;
  }

  if (!files?.length) {
    return null;
  }

  const paths = files
    .filter((file) => file.name)
    .map((file) => `${userId}/${file.name}`);

  if (paths.length === 0) {
    return null;
  }

  const { error: removeError } = await supabase.storage
    .from(STUDY_MATERIALS_BUCKET)
    .remove(paths);

  if (removeError) {
    return removeError.message;
  }

  return null;
}

/** Deletes all app data for a user, then removes the Supabase Auth user. */
export async function deleteUserAccount(
  supabase: SupabaseClient,
  userId: string,
): Promise<DeleteUserAccountResult> {
  const { data: materials, error: materialsListError } = await supabase
    .from("study_materials")
    .select("id")
    .eq("user_id", userId);

  if (materialsListError) {
    return { ok: false, message: materialsListError.message, status: 500 };
  }

  for (const material of materials ?? []) {
    const deleted = await deleteStudyMaterialById(
      supabase,
      userId,
      String(material.id),
    );
    if (!deleted.ok) {
      return { ok: false, message: deleted.message, status: deleted.status };
    }
  }

  const storageWarning = await removeUserStoragePrefix(supabase, userId);
  if (storageWarning) {
    console.warn(
      `[deleteUserAccount] storage cleanup warning for ${userId}:`,
      storageWarning,
    );
  }

  const tableDeletes: { table: string; error: { message: string } | null }[] =
    [];

  for (const table of [
    "chat_sessions",
    "quizzes",
    "schedules",
    "subjects",
    "streaks",
  ] as const) {
    const { error } = await supabase.from(table).delete().eq("user_id", userId);
    tableDeletes.push({ table, error });
  }

  for (const { table, error } of tableDeletes) {
    if (error) {
      return { ok: false, message: `${table}: ${error.message}`, status: 500 };
    }
  }

  const { error: profileError } = await supabase
    .from("users")
    .delete()
    .eq("id", userId);

  if (profileError) {
    return { ok: false, message: profileError.message, status: 500 };
  }

  const { error: authError } = await supabase.auth.admin.deleteUser(userId);

  if (authError) {
    return { ok: false, message: authError.message, status: 500 };
  }

  return { ok: true, userId };
}
