import { useState, useEffect } from 'react';
import { savedViewsService, type SavedView } from '../services/saved-views.service';

export function useSavedViews(page?: string) {
  const [views, setViews] = useState<SavedView[]>(
    page ? savedViewsService.getByPage(page) : savedViewsService.getAll()
  );

  useEffect(() => {
    const handleUpdate = () => {
      setViews(page ? savedViewsService.getByPage(page) : savedViewsService.getAll());
    };

    savedViewsService.on('saved', handleUpdate);
    savedViewsService.on('deleted', handleUpdate);
    savedViewsService.on('updated', handleUpdate);

    return () => {
      savedViewsService.off('saved', handleUpdate);
      savedViewsService.off('deleted', handleUpdate);
      savedViewsService.off('updated', handleUpdate);
    };
  }, [page]);

  const saveView = (view: Omit<SavedView, 'id' | 'createdAt'>) => {
    return savedViewsService.save(view);
  };

  const deleteView = (id: string) => {
    savedViewsService.delete(id);
  };

  const updateView = (id: string, updates: Partial<Omit<SavedView, 'id' | 'createdAt'>>) => {
    savedViewsService.update(id, updates);
  };

  return {
    views,
    saveView,
    deleteView,
    updateView,
  };
}
