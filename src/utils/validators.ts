// src/utils/validators.ts
/**
 * Comprehensive input validation and sanitization layer
 * Ensures data integrity and prevents security vulnerabilities
 */

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Validate and sanitize barcode/QR code
 */
export const validateBarcode = (barcode: unknown): ValidationResult<string> => {
  const errors: string[] = [];

  if (!barcode || typeof barcode !== 'string') {
    errors.push('Barcode deve ser uma string válida');
    return { isValid: false, errors };
  }

  const sanitized = barcode.trim().toUpperCase();

  if (sanitized.length < 5 || sanitized.length > 50) {
    errors.push('Barcode deve ter entre 5 e 50 caracteres');
    return { isValid: false, errors };
  }

  // Check for valid barcode format (alphanumeric + hyphens + spaces)
  // Allow letters for Mercado Livre codes like "2200D1241459785"
  if (!/^[A-Z0-9\-\s]+$/.test(sanitized)) {
    errors.push('Barcode contém caracteres inválidos');
    return { isValid: false, errors };
  }

  return { isValid: true, data: sanitized };
};

/**
 * Validate operator name
 */
export const validateOperatorName = (name: unknown): ValidationResult<string> => {
  const errors: string[] = [];

  if (!name || typeof name !== 'string') {
    errors.push('Nome do operador deve ser texto');
    return { isValid: false, errors };
  }

  const sanitized = name.trim();

  if (sanitized.length < 2 || sanitized.length > 100) {
    errors.push('Nome deve ter entre 2 e 100 caracteres');
    return { isValid: false, errors };
  }

  // Only letters, numbers, spaces, and common accents
  if (!/^[^\p{P}]{2,100}$/u.test(sanitized)) {
    errors.push('Nome contém caracteres inválidos');
    return { isValid: false, errors };
  }

  return { isValid: true, data: sanitized };
};

/**
 * Validate declared count
 */
export const validateDeclaredCount = (count: unknown): ValidationResult<number> => {
  const errors: string[] = [];

  if (!Number.isInteger(count)) {
    errors.push('Quantidade deve ser um número inteiro');
    return { isValid: false, errors };
  }

  const num = count as number;

  if (num < 0 || num > 10000) {
    errors.push('Quantidade deve estar entre 0 e 10.000');
    return { isValid: false, errors };
  }

  return { isValid: true, data: num };
};

/**
 * Validate session ID
 */
export const validateSessionId = (sessionId: unknown): ValidationResult<string> => {
  const errors: string[] = [];

  if (!sessionId || typeof sessionId !== 'string') {
    errors.push('Session ID deve ser uma string');
    return { isValid: false, errors };
  }

  const sanitized = sessionId.trim();

  // UUID or custom session ID format
  if (!/^[a-z0-9\-]{8,50}$/.test(sanitized)) {
    errors.push('Session ID formato inválido');
    return { isValid: false, errors };
  }

  return { isValid: true, data: sanitized };
};

/**
 * Validate email
 */
export const validateEmail = (email: unknown): ValidationResult<string> => {
  const errors: string[] = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email deve ser texto');
    return { isValid: false, errors };
  }

  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(sanitized)) {
    errors.push('Email formato inválido');
    return { isValid: false, errors };
  }

  if (sanitized.length > 254) {
    errors.push('Email muito longo');
    return { isValid: false, errors };
  }

  return { isValid: true, data: sanitized };
};

/**
 * Validate numeric value
 */
export const validateNumeric = (
  value: unknown,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  fieldName = 'Valor'
): ValidationResult<number> => {
  const errors: string[] = [];

  if (!Number.isFinite(value)) {
    errors.push(`${fieldName} deve ser um número válido`);
    return { isValid: false, errors };
  }

  const num = Number(value);

  if (num < min || num > max) {
    errors.push(`${fieldName} deve estar entre ${min} e ${max}`);
    return { isValid: false, errors };
  }

  return { isValid: true, data: num };
};

/**
 * Validate string with length constraints
 */
export const validateString = (
  value: unknown,
  minLength = 1,
  maxLength = 255,
  fieldName = 'Campo'
): ValidationResult<string> => {
  const errors: string[] = [];

  if (typeof value !== 'string') {
    errors.push(`${fieldName} deve ser texto`);
    return { isValid: false, errors };
  }

  const sanitized = value.trim();

  if (sanitized.length < minLength || sanitized.length > maxLength) {
    errors.push(`${fieldName} deve ter entre ${minLength} e ${maxLength} caracteres`);
    return { isValid: false, errors };
  }

  return { isValid: true, data: sanitized };
};

/**
 * Validate scanned package data
 */
export const validateScannedPackage = (
  data: unknown
): ValidationResult<{ barcode: string; type: string; value: string; timestamp: number }> => {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Pacote deve ser um objeto válido');
    return { isValid: false, errors };
  }

  const pkg = data as Record<string, unknown>;

  // Validate barcode
  const barcodeValidation = validateBarcode(pkg.barcode);
  if (!barcodeValidation.isValid) {
    errors.push(...(barcodeValidation.errors || []));
  }

  // Validate type
  if (!['SHOPEE', 'MERCADO_LIVRE', 'AVULSO', 'LOGMANAGER'].includes(pkg.type as string)) {
    errors.push('Tipo de pacote inválido');
  }

  // Validate value (optional but if present, validate)
  if (pkg.value !== undefined && typeof pkg.value !== 'string') {
    errors.push('Valor deve ser texto (string)');
  }

  // Validate timestamp
  if (!Number.isInteger(pkg.timestamp) || (pkg.timestamp as number) < 0) {
    errors.push('Timestamp inválido');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    data: {
      barcode: barcodeValidation.data!,
      type: pkg.type as string,
      value: (pkg.value as string) || '',
      timestamp: pkg.timestamp as number,
    },
  };
};

/**
 * Sanitize log messages (prevent injection attacks)
 */
export const sanitizeLogMessage = (message: string): string => {
  return message
    .replace(/\n/g, ' | ')
    .replace(/\r/g, '')
    .slice(0, 1000);
};

/**
 * Batch validation result
 */
export interface BatchValidationResult<T> {
  validItems: T[];
  invalidItems: Array<{ index: number; errors: string[] }>;
  isFullyValid: boolean;
}

/**
 * Validate array of items
 */
export const validateBatch = <T>(
  items: unknown[],
  validator: (item: unknown) => ValidationResult<T>
): BatchValidationResult<T> => {
  const validItems: T[] = [];
  const invalidItems: Array<{ index: number; errors: string[] }> = [];

  items.forEach((item, index) => {
    const result = validator(item);
    if (result.isValid && result.data) {
      validItems.push(result.data);
    } else {
      invalidItems.push({
        index,
        errors: result.errors || ['Validação falhou'],
      });
    }
  });

  return {
    validItems,
    invalidItems,
    isFullyValid: invalidItems.length === 0,
  };
};

export default {
  validateBarcode,
  validateOperatorName,
  validateDeclaredCount,
  validateSessionId,
  validateEmail,
  validateNumeric,
  validateString,
  validateScannedPackage,
  sanitizeLogMessage,
  validateBatch,
};
