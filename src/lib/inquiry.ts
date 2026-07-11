// Dispatch the global "open inquiry modal" event. Any Inquire button can call
// this instead of a mailto: link. `subject` pre-fills the modal context;
// `source` tags where the inquiry originated.
export function openInquiry(opts?: { subject?: string; source?: string }): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('open-inquiry', { detail: opts ?? {} })
  );
}
