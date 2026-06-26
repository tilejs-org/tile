import type {
  FieldDefinition,
  FieldType,
  ValidatorFunction,
} from "../core/types.js";

/**
 * Validates and normalizes field values against a schema definition.
 */
export class Validator {
  /**
   * Validates one value against a field definition.
   *
   * @example
   * ```ts
   * Validator.validate("alice@example.com", { type: String, required: true }, "email");
   * ```
   */
  static validate(
    value: any,
    fieldDef: FieldDefinition,
    fieldName: string,
  ): void {
    if (value === undefined || value === null) {
      if (fieldDef.required === true) {
        throw new Error(`Field "${fieldName}" is required`);
      }
      return;
    }

    Validator.validateType(value, fieldDef.type, fieldName);

    if (typeof value === "string") {
      if (
        fieldDef.minLength !== undefined &&
        value.length < fieldDef.minLength
      ) {
        throw new Error(
          `Field "${fieldName}" must have at least ${fieldDef.minLength} characters`,
        );
      }
      if (
        fieldDef.maxLength !== undefined &&
        value.length > fieldDef.maxLength
      ) {
        throw new Error(
          `Field "${fieldName}" must have at most ${fieldDef.maxLength} characters`,
        );
      }
    }

    if (typeof value === "number") {
      if (fieldDef.min !== undefined && value < fieldDef.min) {
        throw new Error(
          `Field "${fieldName}" must be at least ${fieldDef.min}`,
        );
      }
      if (fieldDef.max !== undefined && value > fieldDef.max) {
        throw new Error(`Field "${fieldName}" must be at most ${fieldDef.max}`);
      }
    }

    if (fieldDef.enum && !fieldDef.enum.includes(value)) {
      throw new Error(
        `Field "${fieldName}" must be one of: ${fieldDef.enum.join(", ")}`,
      );
    }
  }

  private static validateType(
    value: any,
    expectedType?:
      | FieldType
      | typeof String
      | typeof Number
      | typeof Boolean
      | typeof Date,
    fieldName?: string,
  ): void {
    if (!expectedType) return;
    if (!fieldName) fieldName = "field";

    const typeString = Validator.normalizeType(expectedType);

    const actualType = typeof value;
    const isArray = Array.isArray(value);

    const typeMap: Record<string, string[]> = {
      String: ["string"],
      Number: ["number"],
      Boolean: ["boolean"],
      Date: ["object"],
      Array: ["object"],
      Object: ["object"],
    };

    if (typeString === "Array") {
      if (!isArray) {
        throw new Error(`Field "${fieldName}" must be an array`);
      }
    } else if (typeString === "Date") {
      if (
        !(value instanceof Date) &&
        typeof value !== "string" &&
        typeof value !== "number"
      ) {
        throw new Error(`Field "${fieldName}" must be a Date`);
      }
    } else {
      const validTypes = typeMap[typeString] || [];
      if (!validTypes.includes(actualType)) {
        throw new Error(`Field "${fieldName}" must be of type ${typeString}`);
      }
    }
  }

  private static normalizeType(
    type:
      | FieldType
      | typeof String
      | typeof Number
      | typeof Boolean
      | typeof Date,
  ): FieldType {
    if (typeof type === "function") {
      if (type === String) return "String";
      if (type === Number) return "Number";
      if (type === Boolean) return "Boolean";
      if (type === Date) return "Date";
    }
    return type as FieldType;
  }

  /**
   * Converts string casing, trims values, and hydrates dates.
   *
   * @example
   * ```ts
   * const name = Validator.processValue("  Israel  ", { type: String, trim: true }, "name");
   * ```
   */
  static processValue(
    value: any,
    fieldDef: FieldDefinition,
    fieldName: string,
  ): any {
    if (value === undefined || value === null) {
      if (fieldDef.default !== undefined) {
        return typeof fieldDef.default === "function"
          ? fieldDef.default()
          : fieldDef.default;
      }
      return value;
    }

    let processed = value;

    if (typeof processed === "string") {
      if (fieldDef.lowercase) {
        processed = processed.toLowerCase();
      }
      if (fieldDef.trim) {
        processed = processed.trim();
      }
    }

    if (fieldDef.type === "Date" || fieldDef.type === Date) {
      if (!(processed instanceof Date)) {
        processed = new Date(processed);
      }
    }

    return processed;
  }
}
