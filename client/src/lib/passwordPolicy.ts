// Single source of truth for the app's password policy. Mirrors the server-side
// rule enforced in Supabase Auth (password_min_length = 8,
// password_required_characters = letters + digits).
export const PASSWORD_MIN_LENGTH = 8;

export type PasswordCheck = { label: string; ok: boolean };

export function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    { label: `At least ${PASSWORD_MIN_LENGTH} characters`, ok: password.length >= PASSWORD_MIN_LENGTH },
    { label: "Contains a letter", ok: /[A-Za-z]/.test(password) },
    { label: "Contains a number", ok: /[0-9]/.test(password) },
  ];
}

// Returns an error message if the password is invalid, or null if it passes.
export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!/[A-Za-z]/.test(password)) {
    return "Password must include at least one letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include at least one number.";
  }
  return null;
}

export function isPasswordValid(password: string): boolean {
  return validatePassword(password) === null;
}
