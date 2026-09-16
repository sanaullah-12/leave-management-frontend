// The animated introduction is a first-launch thing only. It runs before the
// login screen, so there is no account to hang the flag on yet - it lives in
// localStorage next to the known-user flag, per browser or installed app.
//
// Storage can throw or come back empty (private mode, cleared site data, a
// locked-down enterprise browser). Treating that as "already seen" is the
// right failure: a returning user meeting the introduction again on every
// launch is far worse than a new user missing it once.
const ONBOARDED_KEY = "nexora_onboarded";

export const markOnboarded = (): void => {
  try {
    localStorage.setItem(ONBOARDED_KEY, "1");
  } catch {
    // localStorage unavailable - no-op.
  }
};

export const hasSeenOnboarding = (): boolean => {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === "1";
  } catch {
    return true;
  }
};
