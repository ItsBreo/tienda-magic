import { useState, useCallback, useMemo } from 'react';

/**
 * Hook para gestionar la selección múltiple de elementos por ID.
 */
export function useSelection<T extends { id: number | string }>(items: T[]) {
    const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());

    const toggle = useCallback((id: number | string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const selectAll = useCallback(() => {
        if (selectedIds.size === items.length && items.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(items.map((item) => item.id)));
        }
    }, [items, selectedIds.size]);

    const clear = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const isSelected = useCallback((id: number | string) => {
        return selectedIds.has(id);
    }, [selectedIds]);

    const allSelected = useMemo(() => {
        return items.length > 0 && selectedIds.size === items.length;
    }, [items, selectedIds.size]);

    const someSelected = useMemo(() => {
        return selectedIds.size > 0 && selectedIds.size < items.length;
    }, [items, selectedIds.size]);

    const selectedCount = selectedIds.size;

    const selectedList = useMemo(() => Array.from(selectedIds), [selectedIds]);

    return {
        selectedIds,
        selectedList,
        selectedCount,
        toggle,
        selectAll,
        clear,
        isSelected,
        allSelected,
        someSelected,
    };
}

export default useSelection;
