/**
 * Session tokens.
 *
 * The access token is short-lived (minutes) and the refresh token is rotated
 * on every use by the server; replaying an old refresh token revokes the whole
 * session. Both live in localStorage because the API is on a different site
 * from the app, where cookies would be third-party and blocked by browsers.
 *
 * Every read of the tokens goes through here so the refresh flow has one
 * source of truth.
 */

const ACCESS_KEY = "token";
const REFRESH_KEY = "refreshToken";

export const getAccessToken = (): string | null => {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
};

export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
};

export const setTokens = (token: string, refreshToken?: string | null) => {
  try {
    localStorage.setItem(ACCESS_KEY, token);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  } catch {
    // Storage unavailable: the session lasts for this page only.
  }
};

export const clearTokens = () => {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem("user");
  } catch {
    // Nothing to clear.
  }
};
