import { useState, useEffect } from 'react';
import { favoritesService, type Favorite } from '../services/favorites.service';

/**
 * Hook for managing favorites
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>(favoritesService.getAll());

  useEffect(() => {
    const handleUpdate = () => {
      setFavorites(favoritesService.getAll());
    };

    favoritesService.on('added', handleUpdate);
    favoritesService.on('removed', handleUpdate);
    favoritesService.on('cleared', handleUpdate);

    return () => {
      favoritesService.off('added', handleUpdate);
      favoritesService.off('removed', handleUpdate);
      favoritesService.off('cleared', handleUpdate);
    };
  }, []);

  const isFavorite = (id: string) => favoritesService.isFavorite(id);

  const toggleFavorite = (favorite: Omit<Favorite, 'addedAt'>) => {
    return favoritesService.toggle(favorite);
  };

  const addFavorite = (favorite: Omit<Favorite, 'addedAt'>) => {
    favoritesService.add(favorite);
  };

  const removeFavorite = (id: string) => {
    favoritesService.remove(id);
  };

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites: () => favoritesService.clear(),
  };
}

/**
 * Hook for a specific favorite item
 */
export function useFavorite(id: string) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [favorite, setFavorite] = useState(isFavorite(id));

  useEffect(() => {
    setFavorite(isFavorite(id));
  }, [id, isFavorite]);

  const toggle = (item: Omit<Favorite, 'addedAt'>) => {
    const result = toggleFavorite(item);
    setFavorite(result);
    return result;
  };

  return [favorite, toggle] as const;
}
