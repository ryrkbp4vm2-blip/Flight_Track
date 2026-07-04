import { useEffect, useRef, useState } from "react";

/**
 * Copies the current URL (which encodes the selection via useUrlSync) so a
 * contact can be shared as a deep link.
 */
export default function ShareButton() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (insecure context / permission denied) — no-op.
    }
  }

  return (
    <button className={`detail-btn${copied ? " active" : ""}`} onClick={copy}>
      {copied ? "Copied ✓" : "Share"}
    </button>
  );
}
