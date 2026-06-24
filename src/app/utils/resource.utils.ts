interface ResourceValueReader<T> {
  hasValue(): boolean;
  value(): T;
}

// Legge il valore della resource solo quando e disponibile, evitando throw in stato error.
export function readResourceValue<T>(resource: ResourceValueReader<T>): T | undefined {
  if (!resource.hasValue()) {
    return undefined;
  }

  return resource.value();
}

// Ritorna un fallback stabile quando la resource non ha un valore leggibile.
export function readResourceValueOr<T>(resource: ResourceValueReader<T>, fallback: T): T {
  return readResourceValue(resource) ?? fallback;
}
