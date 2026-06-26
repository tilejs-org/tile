import type {
  FieldDefinition,
  FieldType,
  SchemaDescription,
  SchemaFieldDescription,
  SchemaOptions,
} from "./types.js";

/**
 * Defines the shape and rules for a collection.
 *
 * @example
 * ```ts
 * const userSchema = new Schema(
 *   {
 *     email: { type: String, required: true, unique: true },
 *     name: { type: String, required: true },
 *   },
 *   {
 *     _id: true,
 *     timestamps: true,
 *     versionKey: true,
 *   }
 * );
 * ```
 */
export class Schema<T = any> {
  private fields: Record<string, FieldDefinition> = {};
  private options: SchemaOptions;

  /**
   * Creates a new schema from a field definition map.
   *
   * @param definition - Field configuration or shorthand constructors.
   * @param options - Schema-level options such as timestamps.
   */
  constructor(
    definition: Record<
      string,
      | FieldDefinition
      | FieldType
      | typeof String
      | typeof Number
      | typeof Boolean
      | typeof Date
    >,
    options?: SchemaOptions,
  ) {
    this.options = options || {};
    this.parseDefinition(definition);
    this.ensureInternalFields();
  }

  private parseDefinition(
    definition: Record<
      string,
      | FieldDefinition
      | FieldType
      | typeof String
      | typeof Number
      | typeof Boolean
      | typeof Date
    >,
  ): void {
    for (const [key, value] of Object.entries(definition)) {
      if (typeof value === "function") {
        this.fields[key] = { type: this.getTypeFromConstructor(value) };
      } else if (typeof value === "string") {
        this.fields[key] = { type: value as FieldType };
      } else {
        this.fields[key] = value as FieldDefinition;
      }
    }
  }

  private ensureInternalFields(): void {
    if (this.options._id === false) {
      delete this.fields._id;
    } else if (this.fields._id) {
      this.fields._id = {
        ...this.fields._id,
        type: "String",
        unique: true,
        auto: true,
        required: true,
      };
    } else {
      this.fields._id = {
        type: "String",
        unique: true,
        auto: true,
        required: true,
      };
    }

    if (this.options.versionKey === false) {
      delete this.fields.__v;
      return;
    }

    this.fields.__v = {
      type: "Number",
      default: 0,
      required: true,
    };

    const orderedFields: Record<string, FieldDefinition> = {};

    if (this.fields._id) {
      orderedFields._id = this.fields._id;
    }

    for (const [name, field] of Object.entries(this.fields)) {
      if (name === "_id" || name === "__v") {
        continue;
      }

      orderedFields[name] = field;
    }

    if (this.fields.__v) {
      orderedFields.__v = this.fields.__v;
    }

    this.fields = orderedFields;
  }

  private getTypeFromConstructor(constructor: Function): FieldType {
    if (constructor === String) return "String";
    if (constructor === Number) return "Number";
    if (constructor === Boolean) return "Boolean";
    if (constructor === Date) return "Date";
    if (constructor === Array) return "Array";
    if (constructor === Object) return "Object";
    return "String";
  }

  private getTypeName(
    value:
      | FieldType
      | typeof String
      | typeof Number
      | typeof Boolean
      | typeof Date
      | undefined,
  ): string {
    if (!value) {
      return "Unknown";
    }

    if (typeof value === "function") {
      return this.getTypeFromConstructor(value);
    }

    return value;
  }

  /**
   * Returns the parsed field map.
   */
  getFields(): Record<string, FieldDefinition> {
    return this.fields;
  }

  /**
   * Returns the schema options.
   */
  getOptions(): SchemaOptions {
    return this.options;
  }

  /**
   * Returns the definition for one field, if present.
   */
  getFieldDefinition(fieldName: string): FieldDefinition | undefined {
    return this.fields[fieldName];
  }

  /**
   * Returns a developer-friendly schema description.
   *
   * @example
   * ```ts
   * console.log(User.schema.describe());
   * ```
   */
  describe(): SchemaDescription {
    const fields: SchemaDescription["fields"] = {};

    const addFieldDescription = (
      name: string,
      field: FieldDefinition,
      overrides?: Partial<Pick<SchemaFieldDescription, "unique" | "auto" | "required">>,
    ): void => {
      fields[name] = {
        name,
        type: this.getTypeName(field.type),
        required: overrides?.required ?? field.required === true,
        unique: overrides?.unique ?? field.unique === true,
        auto: overrides?.auto ?? field.auto === true,
        default: field.default,
        lowercase: field.lowercase === true,
        trim: field.trim === true,
        minLength: field.minLength,
        maxLength: field.maxLength,
        min: field.min,
        max: field.max,
        enum: field.enum,
      };
    };

    if (this.fields._id) {
      addFieldDescription("_id", this.fields._id, {
        required: true,
        unique: true,
        auto: true,
      });
    }

    for (const [name, field] of Object.entries(this.fields)) {
      if (name === "_id" || name === "__v") {
        continue;
      }

      addFieldDescription(name, field);
    }

    if (this.fields.__v) {
      addFieldDescription("__v", this.fields.__v, {
        required: true,
        unique: false,
        auto: false,
      });
    }

    return {
      fields,
      timestamps: this.hasTimestamps(),
      collection: this.options.collection,
    };
  }

  /**
   * Checks whether the schema should add `createdAt` and `updatedAt`.
   */
  hasTimestamps(): boolean {
    return this.options.timestamps !== false;
  }

  /**
   * Checks whether the internal `_id` field should be exposed.
   */
  hasInternalId(): boolean {
    return this.options._id !== false;
  }

  /**
   * Checks whether the internal `__v` field should be exposed.
   */
  hasVersionKey(): boolean {
    return this.options.versionKey !== false;
  }
}
