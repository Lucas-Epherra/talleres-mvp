export type VehicleFormDraft = {
  customerId?: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: string;
  mileage: string;
  notes: string;
};

export type ValidVehicleFormData = {
  customerId?: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number | null;
  mileage: number | null;
  notes: string | null;
};

type VehicleFormValidationOptions = {
  requireCustomer?: boolean;
  validCustomerIds?: readonly string[];
};

type VehicleFormValidationResult =
  | {
      isValid: true;
      data: ValidVehicleFormData;
    }
  | {
      isValid: false;
      message: string;
    };

const LICENSE_PLATE_PATTERN = /^[A-Z0-9]{5,10}$/;
const MIN_VEHICLE_YEAR = 1900;
const MAX_MILEAGE = 2_000_000;
const MAX_TEXT_LENGTH = 80;
const MAX_NOTES_LENGTH = 800;

/**
 * Reads vehicle form fields from FormData and applies first-pass text
 * normalization before validation.
 */
export function readVehicleFormDraft(formData: FormData): VehicleFormDraft {
  return {
    customerId: getStringValue(formData, "customerId"),
    licensePlate: normalizeLicensePlate(
      getStringValue(formData, "licensePlate"),
    ),
    brand: normalizeHumanText(getStringValue(formData, "brand")),
    model: normalizeHumanText(getStringValue(formData, "model")),
    year: getStringValue(formData, "year"),
    mileage: getStringValue(formData, "mileage"),
    notes: normalizeMultilineText(getStringValue(formData, "notes")),
  };
}

/**
 * Validates vehicle form data before sending it to the API.
 *
 * Frontend validation improves UX and blocks obvious bad input, but backend
 * validation must still exist because client-side checks are not security
 * boundaries.
 */
export function validateVehicleFormDraft(
  draft: VehicleFormDraft,
  options: VehicleFormValidationOptions = {},
): VehicleFormValidationResult {
  if (options.requireCustomer) {
    if (!draft.customerId) {
      return {
        isValid: false,
        message: "Seleccioná un cliente para asociar el vehículo.",
      };
    }

    if (
      options.validCustomerIds &&
      !options.validCustomerIds.includes(draft.customerId)
    ) {
      return {
        isValid: false,
        message: "El cliente seleccionado no es válido.",
      };
    }
  }

  if (!draft.licensePlate) {
    return {
      isValid: false,
      message: "La patente es obligatoria.",
    };
  }

  if (!LICENSE_PLATE_PATTERN.test(draft.licensePlate)) {
    return {
      isValid: false,
      message:
        "La patente debe tener entre 5 y 10 caracteres alfanuméricos. Podés escribir espacios o guiones; el sistema los normaliza automáticamente.",
    };
  }

  if (!draft.brand) {
    return {
      isValid: false,
      message: "La marca es obligatoria.",
    };
  }

  if (draft.brand.length > MAX_TEXT_LENGTH) {
    return {
      isValid: false,
      message: `La marca no puede superar ${MAX_TEXT_LENGTH.toString()} caracteres.`,
    };
  }

  if (!draft.model) {
    return {
      isValid: false,
      message: "El modelo es obligatorio.",
    };
  }

  if (draft.model.length > MAX_TEXT_LENGTH) {
    return {
      isValid: false,
      message: `El modelo no puede superar ${MAX_TEXT_LENGTH.toString()} caracteres.`,
    };
  }

  const yearResult = parseOptionalInteger(
    draft.year,
    "El año",
    MIN_VEHICLE_YEAR,
    getMaxVehicleYear(),
  );

  if (!yearResult.isValid) {
    return {
      isValid: false,
      message: yearResult.message,
    };
  }

  const mileageResult = parseOptionalInteger(
    draft.mileage,
    "El kilometraje",
    0,
    MAX_MILEAGE,
  );

  if (!mileageResult.isValid) {
    return {
      isValid: false,
      message: mileageResult.message,
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
      customerId: draft.customerId,
      licensePlate: draft.licensePlate,
      brand: draft.brand,
      model: draft.model,
      year: yearResult.value,
      mileage: mileageResult.value,
      notes: draft.notes.length > 0 ? draft.notes : null,
    },
  };
}

/**
 * Normalizes license plates into uppercase alphanumeric text.
 *
 * Spaces and hyphens are accepted in the UI but removed before sending the
 * payload to the API.
 */
function normalizeLicensePlate(value: string): string {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

/**
 * Collapses repeated spaces for short human-readable fields.
 */
function normalizeHumanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Normalizes multiline textarea content without destroying line breaks.
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

type OptionalIntegerResult =
  | {
      isValid: true;
      value: number | null;
    }
  | {
      isValid: false;
      message: string;
    };

/**
 * Parses and validates optional integer fields.
 */
function parseOptionalInteger(
  value: string,
  label: string,
  min: number,
  max: number,
): OptionalIntegerResult {
  if (!value) {
    return {
      isValid: true,
      value: null,
    };
  }

  if (!/^\d+$/.test(value)) {
    return {
      isValid: false,
      message: `${label} debe ser un número entero positivo.`,
    };
  }

  const numericValue = Number(value);

  if (!Number.isSafeInteger(numericValue)) {
    return {
      isValid: false,
      message: `${label} debe ser un número entero válido.`,
    };
  }

  if (numericValue < min || numericValue > max) {
    return {
      isValid: false,
      message: `${label} debe estar entre ${min.toString()} y ${max.toString()}.`,
    };
  }

  return {
    isValid: true,
    value: numericValue,
  };
}

/**
 * Returns the highest accepted vehicle year.
 */
function getMaxVehicleYear(): number {
  return new Date().getFullYear() + 1;
}