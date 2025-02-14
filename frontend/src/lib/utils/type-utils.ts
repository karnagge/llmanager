export function toRecord<T extends object>(obj: T): Record<string, unknown> {
  return JSON.parse(JSON.stringify(obj));
}