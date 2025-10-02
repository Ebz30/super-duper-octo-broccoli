import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SupabaseTestPage() {
  let statusMessage = "Not authenticated";

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      statusMessage = `Auth error: ${error.message}`;
    } else if (data?.user) {
      statusMessage = `Signed in as ${data.user.email ?? data.user.id}`;
    }
  } catch (err: unknown) {
    statusMessage =
      (err as Error)?.message ?? "Supabase is not configured. Set env variables.";
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold mb-2">Supabase Test</h1>
      <p className="text-sm">{statusMessage}</p>
      <p className="mt-4 text-xs text-gray-500">
        Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
        {" "}in <code>.env.local</code> then refresh.
      </p>
    </div>
  );
}
