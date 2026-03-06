/**
 * Favorites Service - Manage user favorites/starred items
 */

const FAVORITES_KEY = 'amzboosted-favorites';

export interface Favorite {
  id: string;
  type: 'tool' | 'report' | 'schedule' | 'export';
  name: string;
  path?: string;
  addedAt: number;
}

class FavoritesService {
  private favorites: Favorite[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      this.favorites = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Error loading favorites:', error);
      this.favorites = [];
    }
  }

  private save(): void {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(this.favorites));
    } catch (error) {
      console.warn('Error saving favorites:', error);
    }
  }

  getAll(): Favorite[] {
    return [...this.favorites];
  }

  getByType(type: Favorite['type']): Favorite[] {
    return this.favorites.filter((f) => f.type === type);
  }

  isFavorite(id: string): boolean {
    return this.favorites.some((f) => f.id === id);
  }

  add(favorite: Omit<Favorite, 'addedAt'>): void {
    if (this.isFavorite(favorite.id)) {
      return; // Already favorited
    }

    this.favorites.push({
      ...favorite,
      addedAt: Date.now(),
    });

    this.save();
    this.emit('added', favorite);
  }

  remove(id: string): void {
    const index = this.favorites.findIndex((f) => f.id === id);
    if (index !== -1) {
      const removed = this.favorites.splice(index, 1)[0];
      this.save();
      this.emit('removed', removed);
    }
  }

  toggle(favorite: Omit<Favorite, 'addedAt'>): boolean {
    if (this.isFavorite(favorite.id)) {
      this.remove(favorite.id);
      return false;
    } else {
      this.add(favorite);
      return true;
    }
  }

  clear(): void {
    this.favorites = [];
    this.save();
    this.emit('cleared', null);
  }

  // Simple event emitter
  private listeners = new Map<string, Set<Function>>();

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }
}

export const favoritesService = new FavoritesService();
