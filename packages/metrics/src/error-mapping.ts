import type { ZodIssue } from "zod";
import { ERROR_MESSAGES } from "./constants.js";

/**
 * Maps Zod validation errors to user-friendly error messages
 */
export function mapZodErrorToUserMessage(error: ZodIssue): string {
  const field = error.path.join(".");

  // Handle signature array errors specially
  if (isSignatureArrayError(error)) {
    return ERROR_MESSAGES.SIGNATURE_BYTES_ERROR;
  }

  // Handle specific field errors
  const fieldErrorMap = getFieldSpecificErrorMap();
  const fieldHandler = fieldErrorMap[error.path[0] as string];
  if (fieldHandler) {
    const result = fieldHandler(error);
    if (result) return result;
  }

  // Handle generic error types
  return getGenericErrorMessage(error, field);
}

/**
 * Checks if the error is related to signature array validation
 */
function isSignatureArrayError(error: ZodIssue): boolean {
  return error.path[0] === "signature" && error.path.length > 1;
}

/**
 * Returns field-specific error handlers
 */
function getFieldSpecificErrorMap(): Record<
  string,
  (error: ZodIssue) => string | null
> {
  return {
    ipfsPeerId: (error) => handleStringFieldError(error, "ipfsPeerId"),
    ceramicPeerId: (error) => handleStringFieldError(error, "ceramicPeerId"),
    collectedAt: (error) => handleCollectedAtError(error),
    totalStreams: (error) => handleNumberFieldError(error, "totalStreams"),
    totalPinnedCids: (error) =>
      handleNumberFieldError(error, "totalPinnedCids"),
    environment: (error) => handleEnvironmentError(error),
    signature: (error) => handleSignatureError(error),
  };
}

/**
 * Handles string field validation errors
 */
function handleStringFieldError(
  error: ZodIssue,
  fieldName: string,
): string | null {
  if (error.code === "invalid_type" && error.received === "undefined") {
    return `${ERROR_MESSAGES.MISSING_FIELD}: ${fieldName}`;
  }
  if (
    error.code === "too_small" ||
    (error.code === "invalid_type" && error.expected === "string")
  ) {
    return `${fieldName} ${ERROR_MESSAGES.NON_EMPTY_STRING}`;
  }
  return null;
}

/**
 * Handles collectedAt field validation errors
 */
function handleCollectedAtError(error: ZodIssue): string | null {
  if (error.code === "invalid_type" && error.received === "undefined") {
    return `${ERROR_MESSAGES.MISSING_FIELD}: collectedAt`;
  }
  if (error.code === "invalid_type" && error.expected === "string") {
    return `collectedAt ${ERROR_MESSAGES.MUST_BE_STRING}`;
  }
  if (error.code === "invalid_string" && error.validation === "datetime") {
    return `collectedAt ${ERROR_MESSAGES.VALID_ISO_DATE}`;
  }
  return null;
}

/**
 * Handles number field validation errors
 */
function handleNumberFieldError(
  error: ZodIssue,
  fieldName: string,
): string | null {
  if (error.code === "invalid_type" && error.received === "undefined") {
    return `${ERROR_MESSAGES.MISSING_FIELD}: ${fieldName}`;
  }
  if (
    error.code === "too_small" ||
    (error.code === "invalid_type" && error.expected === "number")
  ) {
    return `${fieldName} ${ERROR_MESSAGES.NON_NEGATIVE_NUMBER}`;
  }
  return null;
}

/**
 * Handles environment field validation errors
 */
function handleEnvironmentError(error: ZodIssue): string | null {
  if (error.code === "invalid_type" && error.received === "undefined") {
    return `${ERROR_MESSAGES.MISSING_FIELD}: environment`;
  }
  if (error.code === "invalid_enum_value") {
    return ERROR_MESSAGES.ENVIRONMENT_VALUES;
  }
  return null;
}

/**
 * Handles signature field validation errors
 */
function handleSignatureError(error: ZodIssue): string | null {
  if (error.code === "invalid_type" && error.received === "undefined") {
    return `${ERROR_MESSAGES.MISSING_FIELD}: signature`;
  }
  if (error.code === "invalid_type" && error.expected === "array") {
    return `signature ${ERROR_MESSAGES.MUST_BE_ARRAY}`;
  }
  return null;
}

/**
 * Returns generic error messages for unhandled cases
 */
function getGenericErrorMessage(error: ZodIssue, field: string): string {
  if (error.path.length === 0) {
    // Root-level errors
    if (error.code === "invalid_type" && error.expected === "object") {
      return ERROR_MESSAGES.METRICS_MUST_BE_OBJECT;
    }
    return error.message;
  }

  // Field-level errors that weren't handled above
  if (error.code === "invalid_type" && error.received === "undefined") {
    return `${ERROR_MESSAGES.MISSING_FIELD}: ${field}`;
  }

  return error.message;
}
