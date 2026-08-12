import { AbstractControl } from '@angular/forms';

const MESSAGES: Record<string, (err: Record<string, unknown>) => string> = {
  required: () => 'This field is required.',
  email: () => 'Enter a valid email address.',
  minlength: (err) => `Must be at least ${err['requiredLength']} characters.`,
  maxlength: (err) => `Must be at most ${err['requiredLength']} characters.`,
  min: (err) => `Must be at least ${err['min']}.`,
  max: (err) => `Must be at most ${err['max']}.`,
  pattern: () => 'Value does not match the required format.',
  passwordMismatch: () => 'Passwords do not match.',
  passwordStrength: () =>
    'Password must include an uppercase letter, lowercase letter, number, and special character.',
  server: (err) => String(err),
};

export function firstErrorMessage(control: AbstractControl | null): string | null {
  if (!control || !control.errors || (!control.touched && !control.dirty)) return null;
  const [key, err] = Object.entries(control.errors)[0];
  const formatter = MESSAGES[key];
  return formatter ? formatter(err) : 'Invalid value.';
}

export function applyServerErrors(control: AbstractControl, errors: Record<string, string[]> | undefined): void {
  if (!errors) return;
  for (const [path, messages] of Object.entries(errors)) {
    const field = control.get(path.split('.').pop() ?? path);
    field?.setErrors({ server: messages[0] });
  }
}
