import { redirect } from "next/navigation";
import { HomeLanding } from "@/components/marketing/HomeLanding";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (user && !error) {
    redirect("/dashboard");
  }

  return <HomeLanding isAuthenticated={false} />;
}
