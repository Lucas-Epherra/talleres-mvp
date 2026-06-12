export type CustomerFormDraft = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

export type ValidCustomerFormData = {
  fullName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
};

type CustomerFormValidationResult =
  | {
      isValid: true;
      data: ValidCustomerFormData;
    }
  | {
      isValid: false;
      message: string;
    };

type OptionalStringValidationResult =
  | {
      isValid: true;
      value: string | null;
    }
  | {
      isValid: false;
      message: string;
    };

const MIN_FULL_NAME_LENGTH = 2;
const MAX_FULL_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const MAX_ADDRESS_LENGTH = 120;
const MAX_NOTES_LENGTH = 800;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Reads customer form fields from FormData and applies safe first-pass
 * normalization before validation.
 */
export function readCustomerFormDraft(formData: FormData): CustomerFormDraft {
  return {
    fullName: normalizeHumanText(getStringValue(formData, "fullName")),
    phone: getStringValue(formData, "phone"),
    email: normalizeEmail(getStringValue(formData, "email")),
    address: normalizeHumanText(getStringValue(formData, "address")),
    notes: normalizeMultilineText(getStringValue(formData, "notes")),
  };
}

/**
 * Validates customer form data before sending it to the API.
 *
 * Frontend validation improves UX and blocks obvious malformed input, but it
 * is not a security boundary. Backend validation must still enforce the same
 * business rules.
 */
export function validateCustomerFormDraft(
  draft: CustomerFormDraft,
): CustomerFormValidationResult {
  if (!draft.fullName) {
    return {
      isValid: false,
      message: "El nombre del cliente es obligatorio.",
    };
  }

  if (draft.fullName.length < MIN_FULL_NAME_LENGTH) {
    return {
      isValid: false,
      message: `El nombre debe tener al menos ${MIN_FULL_NAME_LENGTH.toString()} caracteres.`,
    };
  }

  if (draft.fullName.length > MAX_FULL_NAME_LENGTH) {
    return {
      isValid: false,
      message: `El nombre no puede superar ${MAX_FULL_NAME_LENGTH.toString()} caracteres.`,
    };
  }

  const phoneResult = parseOptionalArgentinePhone(draft.phone);

  if (!phoneResult.isValid) {
    return {
      isValid: false,
      message: phoneResult.message,
    };
  }

  const emailResult = validateOptionalEmail(draft.email);

  if (!emailResult.isValid) {
    return {
      isValid: false,
      message: emailResult.message,
    };
  }

  if (draft.address.length > MAX_ADDRESS_LENGTH) {
    return {
      isValid: false,
      message: `La dirección no puede superar ${MAX_ADDRESS_LENGTH.toString()} caracteres.`,
    };
  }

  if (draft.notes.length > MAX_NOTES_LENGTH) {
    return {
      isValid: false,
      message: `Las notas no pueden superar ${MAX_NOTES_LENGTH.toString()} caracteres.`,
    };
  }

  return {
    isValid: true,
    data: {
      fullName: draft.fullName,
      phone: phoneResult.value,
      email: emailResult.value,
      address: draft.address.length > 0 ? draft.address : null,
      notes: draft.notes.length > 0 ? draft.notes : null,
    },
  };
}

/**
 * Parses and normalizes an optional Argentinian phone number for this MVP.
 *
 * Accepted examples:
 * 2983654321
 * 2983 654321
 * 02983 654321
 * +54 2983 654321
 *
 * Stored format:
 * 2983 654321
 */
function parseOptionalArgentinePhone(
  value: string,
): OptionalStringValidationResult {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return {
      isValid: true,
      value: null,
    };
  }

  if (!/^[+\d\s().-]+$/.test(normalizedValue)) {
    return {
      isValid: false,
      message:
        "El teléfono solo puede contener números, espacios, guiones, paréntesis o prefijo +54.",
    };
  }

  let digits = normalizedValue.replace(/\D/g, "");

  if (digits.startsWith("549") && digits.length === 13) {
    digits = digits.slice(3);
  } else if (digits.startsWith("54") && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }

  if (digits.length !== 10) {
    return {
      isValid: false,
      message:
        "El teléfono debe tener 10 dígitos nacionales. Ejemplo válido: 2983 654321.",
    };
  }

  return {
    isValid: true,
    value: `${digits.slice(0, 4)} ${digits.slice(4)}`,
  };
}

/**
 * Validates and normalizes an optional email address.
 */
function validateOptionalEmail(value: string): OptionalStringValidationResult {
  if (!value) {
    return {
      isValid: true,
      value: null,
    };
  }

  if (value.length > MAX_EMAIL_LENGTH) {
    return {
      isValid: false,
      message: `El email no puede superar ${MAX_EMAIL_LENGTH.toString()} caracteres.`,
    };
  }

  if (!EMAIL_PATTERN.test(value)) {
    return {
      isValid: false,
      message: "Ingresá un email válido o dejá el campo vacío.",
    };
  }

  return {
    isValid: true,
    value,
  };
}

/**
 * Normalizes email text into lowercase trimmed value.
 */
function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Collapses repeated spaces for short human-readable fields.
 */
function normalizeHumanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Normalizes multiline textarea content without destroying useful line breaks.
 */
function normalizeMultilineText(value: string): string {
  return value
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/**
 * Reads and trims a string value from form data.
 */
function getStringValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}