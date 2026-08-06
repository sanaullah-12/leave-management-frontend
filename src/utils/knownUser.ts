// Nexora is an invite-only enterprise product - there's no public self-serve
// signup. The landing page uses this flag to decide whether to show the
// "Sign in" button at all: a browser only "knows" about an account after a
// successful login or after finishing an invite-acceptance flow. Everyone
// else is routed to the contact-for-a-demo modal instead.
const KNOWN_USER_KEY = "nexora_known_user";

export const markKnownUser = (): void => {
  try {
    localStorage.setItem(KNOWN_USER_KEY, "1");
  } catch {
    // localStorage unavailable (private mode, disabled storage, etc.) - no-op.
  }
};

export const isKnownUser = (): boolean => {
  try {
    return localStorage.getItem(KNOWN_USER_KEY) === "1";
  } catch {
    return false;
  }
};
