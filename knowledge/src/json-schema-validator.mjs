/** A dependency-free JSON Schema 2020-12 subset validator for Knowledge Engine schemas. */
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function resolve(schema, ref, schemas) {
  const [file, fragment = ""] = ref.split("#");
  let target = file ? schemas.get(file) : schema;
  if (!target) throw new Error(`Unresolved schema reference: ${ref}`);
  for (const part of fragment.replace(/^\//, "").split("/")) if (part) target = target[part];
  return target;
}

export function validateJsonSchema(value, schema, schemas = new Map(), path = "$") {
  if (schema.$ref) return validateJsonSchema(value, resolve(schema, schema.$ref, schemas), schemas, path);
  const errors = [];
  const fail = (message) => errors.push(`${path} ${message}`);
  if (schema.type === "object") {
    if (!value || Array.isArray(value) || typeof value !== "object") return [`${path} must be an object`];
    for (const key of schema.required ?? []) if (!(key in value)) errors.push(`${path}.${key} is required`);
    if (schema.additionalProperties === false) for (const key of Object.keys(value)) if (!(key in (schema.properties ?? {}))) errors.push(`${path}.${key} is not allowed`);
    for (const [key, child] of Object.entries(schema.properties ?? {})) if (key in value) errors.push(...validateJsonSchema(value[key], child, schemas, `${path}.${key}`));
  }
  if (schema.type === "array") {
    if (!Array.isArray(value)) return [`${path} must be an array`];
    if (schema.uniqueItems && new Set(value.map((entry) => JSON.stringify(entry))).size !== value.length) fail("must contain unique items");
    value.forEach((entry, index) => errors.push(...validateJsonSchema(entry, schema.items, schemas, `${path}[${index}]`)));
  }
  if (schema.type === "string" && typeof value !== "string") fail("must be a string");
  if (schema.type === "number" && (typeof value !== "number" || !Number.isFinite(value))) fail("must be a finite number");
  if (schema.type === "integer" && !Number.isInteger(value)) fail("must be an integer");
  if (typeof value === "string") {
    if (schema.minLength && value.length < schema.minLength) fail(`must have at least ${schema.minLength} character(s)`);
    if (schema.pattern && !(new RegExp(schema.pattern).test(value))) fail("does not match required pattern");
    if (schema.format === "uuid" && !uuidPattern.test(value)) fail("must be a UUID");
    if (schema.format === "date-time" && (!dateTimePattern.test(value) || Number.isNaN(Date.parse(value)))) fail("must be an ISO 8601 date-time");
    if (schema.format === "uri" && !/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) fail("must be a URI");
  }
  if (typeof value === "number" && schema.minimum !== undefined && value < schema.minimum) fail(`must be at least ${schema.minimum}`);
  if (typeof value === "number" && schema.maximum !== undefined && value > schema.maximum) fail(`must be at most ${schema.maximum}`);
  if (schema.enum && !schema.enum.includes(value)) fail("must be one of the allowed values");
  return errors;
}
