// Bulk Selection Hook
// Part of: Phase A Todo Enhancement

import { useState, useCallback, useMemo } from 'react'

interface UseBulkSelectionReturn<T> {
  selectedItems: T[]
  selectedIds: Set<string>
  hasSelection: boolean
  isSelected: (item: T) => boolean
  toggleSelection: (item: T) => void
  selectItem: (item: T) => void
  deselectItem: (item: T) => void
  selectAll: (items: T[]) => void
  clearSelection: () => void
  selectMultiple: (items: T[]) => void
  deselectMultiple: (items: T[]) => void
}

export function useBulkSelection<T extends { id: string }>(): UseBulkSelectionReturn<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [itemsMap, setItemsMap] = useState<Map<string, T>>(new Map())

  const hasSelection = selectedIds.size > 0

  const selectedItems = useMemo(() => {
    return Array.from(selectedIds).map(id => itemsMap.get(id)).filter((item): item is T => item !== undefined)
  }, [selectedIds, itemsMap])

  const isSelected = useCallback((item: T): boolean => {
    return selectedIds.has(item.id)
  }, [selectedIds])

  const toggleSelection = useCallback((item: T) => {
    setItemsMap(prev => new Map(prev).set(item.id, item))
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(item.id)) {
        newSet.delete(item.id)
      } else {
        newSet.add(item.id)
      }
      return newSet
    })
  }, [])

  const selectItem = useCallback((item: T) => {
    setItemsMap(prev => new Map(prev).set(item.id, item))
    setSelectedIds(prev => new Set(prev).add(item.id))
  }, [])

  const deselectItem = useCallback((item: T) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(item.id)
      return newSet
    })
  }, [])

  const selectAll = useCallback((items: T[]) => {
    const newItemsMap = new Map(itemsMap)
    items.forEach(item => newItemsMap.set(item.id, item))
    
    setItemsMap(newItemsMap)
    setSelectedIds(new Set(items.map(item => item.id)))
  }, [itemsMap])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const selectMultiple = useCallback((items: T[]) => {
    const newItemsMap = new Map(itemsMap)
    items.forEach(item => newItemsMap.set(item.id, item))
    
    setItemsMap(newItemsMap)
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      items.forEach(item => newSet.add(item.id))
      return newSet
    })
  }, [itemsMap])

  const deselectMultiple = useCallback((items: T[]) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      items.forEach(item => newSet.delete(item.id))
      return newSet
    })
  }, [])

  return {
    selectedItems,
    selectedIds,
    hasSelection,
    isSelected,
    toggleSelection,
    selectItem,
    deselectItem,
    selectAll,
    clearSelection,
    selectMultiple,
    deselectMultiple
  }
}