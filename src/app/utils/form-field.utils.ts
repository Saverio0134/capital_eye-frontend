import type { FieldTree } from '@angular/forms/signals';

export function invalidField<T>(field: FieldTree<T>): boolean {
  return field().touched() && field().invalid();
}
