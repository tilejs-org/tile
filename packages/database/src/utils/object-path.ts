export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return false;
  }

  if (Array.isArray(value) || value instanceof Date) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function cloneValue<T>(value: T): T {
  if (value instanceof Date) {
    return new Date(value.getTime()) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as T;
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, cloneValue(entryValue)]),
    ) as T;
  }

  return value;
}

export function getValueAtPath(source: any, path: string): any {
  if (!path) {
    return source;
  }

  return path.split(".").reduce((current, key) => current?.[key], source);
}

export function setValueAtPath(source: any, path: string, value: any): any {
  if (!path) {
    return value;
  }

  const segments = path.split(".");
  let current = source;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const nextValue = current?.[segment];

    if (!isPlainObject(nextValue)) {
      current[segment] = {};
    }

    current = current[segment];
  }

  current[segments[segments.length - 1]] = value;
  return source;
}

export function deleteValueAtPath(source: any, path: string): any {
  if (!path) {
    return source;
  }

  const segments = path.split(".");
  let current = source;

  for (let index = 0; index < segments.length - 1; index += 1) {
    current = current?.[segments[index]];

    if (!current || typeof current !== "object") {
      return source;
    }
  }

  if (!current || typeof current !== "object") {
    return source;
  }

  delete current[segments[segments.length - 1]];
  return source;
}
