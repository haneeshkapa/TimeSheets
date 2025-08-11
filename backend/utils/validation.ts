interface ValidationRule {
  field: string;
  value: any;
  rules: string[];
  customMessage?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

export class ValidationResult {
  private errors: ValidationError[] = [];

  addError(field: string, message: string) {
    this.errors.push({ field, message });
  }

  isValid(): boolean {
    return this.errors.length === 0;
  }

  getErrors(): ValidationError[] {
    return this.errors;
  }

  getFirstError(): string | null {
    return this.errors.length > 0 ? this.errors[0].message : null;
  }
}

export function validate(rules: ValidationRule[]): ValidationResult {
  const result = new ValidationResult();

  for (const rule of rules) {
    for (const ruleType of rule.rules) {
      const error = validateRule(rule.field, rule.value, ruleType, rule.customMessage);
      if (error) {
        result.addError(rule.field, error);
        break; // Only show first error per field
      }
    }
  }

  return result;
}

function validateRule(field: string, value: any, ruleType: string, customMessage?: string): string | null {
  const parts = ruleType.split(':');
  const rule = parts[0];
  const param = parts[1];

  switch (rule) {
    case 'required':
      if (value === null || value === undefined || String(value).trim() === '') {
        return customMessage || `${field} is required`;
      }
      break;

    case 'string':
      if (typeof value !== 'string') {
        return customMessage || `${field} must be a string`;
      }
      break;

    case 'number':
      if (isNaN(Number(value))) {
        return customMessage || `${field} must be a number`;
      }
      break;

    case 'integer':
      if (!Number.isInteger(Number(value))) {
        return customMessage || `${field} must be an integer`;
      }
      break;

    case 'min':
      if (typeof value === 'string' && value.length < parseInt(param)) {
        return customMessage || `${field} must be at least ${param} characters long`;
      }
      if (typeof value === 'number' && value < parseFloat(param)) {
        return customMessage || `${field} must be at least ${param}`;
      }
      break;

    case 'max':
      if (typeof value === 'string' && value.length > parseInt(param)) {
        return customMessage || `${field} must not exceed ${param} characters`;
      }
      if (typeof value === 'number' && value > parseFloat(param)) {
        return customMessage || `${field} must not exceed ${param}`;
      }
      break;

    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(value))) {
        return customMessage || `${field} must be a valid email address`;
      }
      break;

    case 'alpha':
      if (!/^[a-zA-Z\s]+$/.test(String(value))) {
        return customMessage || `${field} must contain only letters and spaces`;
      }
      break;

    case 'alphanum':
      if (!/^[a-zA-Z0-9\s]+$/.test(String(value))) {
        return customMessage || `${field} must contain only letters, numbers, and spaces`;
      }
      break;

    case 'date':
      if (!isValidDate(String(value))) {
        return customMessage || `${field} must be a valid date`;
      }
      break;

    default:
      throw new Error(`Unknown validation rule: ${rule}`);
  }

  return null;
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0];
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>\"'&]/g, (match) => {
    const escapes: { [key: string]: string } = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '&': '&amp;'
    };
    return escapes[match];
  });
}