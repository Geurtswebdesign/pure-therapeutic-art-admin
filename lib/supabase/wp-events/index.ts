/**
 * Edge function source lives in `supabase/functions/wp-events/index.ts`.
 * This file is intentionally Node/TS-safe so IDE linting in the Next.js app
 * does not fail on Deno-specific imports/globals.
 */
export const WP_EVENTS_FUNCTION_PATH = "supabase/functions/wp-events/index.ts";
