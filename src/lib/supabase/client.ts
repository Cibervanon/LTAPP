import { createBrowserClient, isBrowser } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  if (!isBrowser()) {
    throw new Error("createClient is for browser use only");
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
