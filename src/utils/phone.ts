/**
 * phone.ts
 * --------
 * Client-side E.164 rules, mirroring backend/notifications/phone.js.
 *
 * The backend validates independently and is the authority; this exists so a
 * mistyped number is caught in the form, next to the field, instead of coming
 * back as a request error after the user has already submitted.
 *
 * A phone number is what WhatsApp notifications are delivered to, so the format
 * is not cosmetic: a number stored in the wrong shape means messages that never
 * arrive, silently.
 */

/** Strict E.164: "+" followed by 1-15 digits, first digit non-zero. */
export const E164_PATTERN = /^\+[1-9]\d{1,14}$/;

export const PHONE_PLACEHOLDER = "+923001234567";

export const PHONE_HINT =
  "International format, starting with the country code. Used for WhatsApp notifications.";

export const PHONE_ERROR = `Enter the number in international format, e.g. ${PHONE_PLACEHOLDER}`;

/** Removes spaces, dashes and brackets, and converts a leading "00" to "+". */
export const stripFormatting = (value: string): string => {
  const raw = (value ?? "").trim();
  if (!raw) return "";

  const withPlus = raw.startsWith("00") ? `+${raw.slice(2)}` : raw;
  const digits = withPlus.replace(/[^\d]/g, "");
  return withPlus.startsWith("+") ? `+${digits}` : digits;
};

/** Canonical E.164, or null when the input cannot be trusted. */
export const normalizePhone = (value: string): string | null => {
  const cleaned = stripFormatting(value);
  if (!cleaned) return null;
  return E164_PATTERN.test(cleaned) ? cleaned : null;
};

export const isValidPhone = (value: string): boolean =>
  normalizePhone(value) !== null;

/**
 * react-hook-form validation rules for an optional phone field.
 * Optional everywhere: only WhatsApp delivery depends on it, so requiring it
 * would block users who simply do not want WhatsApp notifications.
 */
export const phoneValidationRules = {
  validate: (value?: string) => {
    if (!value || !value.trim()) return true;
    return isValidPhone(value) || PHONE_ERROR;
  },
};
