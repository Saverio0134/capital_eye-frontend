import { Signal, signal } from '@angular/core';

export interface OptimisticCollectionState<T, TId extends string> {
  readonly items: Signal<T[]>;
  readonly deletedIds: Signal<TId[]>;
  upsert(item: T): void;
  replace(tempId: TId, item: T): void;
  remove(id: TId): void;
  markDeleted(id: TId): void;
  restoreDeleted(id: TId): void;
  applyTo(baseItems: T[]): T[];
  reconcileWithResolvedIds(resolvedIds: Iterable<TId>): void;
}

export function createOptimisticCollectionState<T, TId extends string>(
  getId: (item: T) => TId,
): OptimisticCollectionState<T, TId> {
  const items = signal<T[]>([]);
  const deletedIds = signal<TId[]>([]);

  function upsert(item: T): void {
    items.update((currentItems) => {
      const itemId = getId(item);
      const existingIndex = currentItems.findIndex((currentItem) => getId(currentItem) === itemId);

      if (existingIndex === -1) {
        return [...currentItems, item];
      }

      return currentItems.map((currentItem) => (getId(currentItem) === itemId ? item : currentItem));
    });
  }

  function replace(tempId: TId, item: T): void {
    items.update((currentItems) => {
      const itemId = getId(item);
      const remainingItems = currentItems.filter((currentItem) => getId(currentItem) !== tempId);
      const existingIndex = remainingItems.findIndex((currentItem) => getId(currentItem) === itemId);

      if (existingIndex === -1) {
        return [...remainingItems, item];
      }

      return remainingItems.map((currentItem) =>
        getId(currentItem) === itemId ? item : currentItem,
      );
    });
  }

  function remove(id: TId): void {
    items.update((currentItems) => currentItems.filter((item) => getId(item) !== id));
  }

  function markDeleted(id: TId): void {
    deletedIds.update((currentIds) => (currentIds.includes(id) ? currentIds : [...currentIds, id]));
  }

  function restoreDeleted(id: TId): void {
    deletedIds.update((currentIds) => currentIds.filter((currentId) => currentId !== id));
  }

  function applyTo(baseItems: T[]): T[] {
    const hiddenIds = new Set(deletedIds());
    const mergedItems = new Map(
      baseItems
        .filter((item) => !hiddenIds.has(getId(item)))
        .map((item) => [getId(item), item] as const),
    );

    for (const item of items()) {
      const itemId = getId(item);

      if (hiddenIds.has(itemId)) {
        continue;
      }

      mergedItems.set(itemId, item);
    }

    return Array.from(mergedItems.values());
  }

  function reconcileWithResolvedIds(resolvedIds: Iterable<TId>): void {
    const resolvedIdSet = new Set(resolvedIds);

    items.update((currentItems) =>
      currentItems.filter((item) => !resolvedIdSet.has(getId(item))),
    );
    deletedIds.update((currentIds) =>
      currentIds.filter((currentId) => resolvedIdSet.has(currentId)),
    );
  }

  return {
    items: items.asReadonly(),
    deletedIds: deletedIds.asReadonly(),
    upsert,
    replace,
    remove,
    markDeleted,
    restoreDeleted,
    applyTo,
    reconcileWithResolvedIds,
  };
}
