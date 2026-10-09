import { PREFERENCES_SCRIPT } from "@/lib/preferences";

/**
 * Render inside <head> in the root layout. Runs during HTML parsing, before
 * first paint.
 *
 * The type swap avoids React's dev warning about rendering <script> tags:
 * the server emits a runnable script, the client renders an inert one, and
 * suppressHydrationWarning accepts the difference.
 */
export function PreferencesScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: PREFERENCES_SCRIPT }}
    />
  );
}
