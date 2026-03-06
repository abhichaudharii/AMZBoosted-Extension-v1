type EventCallback = () => void;

export interface SavedView {
  id: string;
  name: string;
  page: string; // 'reports', 'schedules', 'exports'
  filters: Record<string, any>;
  createdAt: Date;
}

class SavedViewsService {
  private static instance: SavedViewsService;
  private readonly storageKey = 'amzboosted_saved_views';
  private listeners: Map<string, EventCallback[]> = new Map();

  private constructor() {}

  static getInstance(): SavedViewsService {
    if (!SavedViewsService.instance) {
      SavedViewsService.instance = new SavedViewsService();
    }
    return SavedViewsService.instance;
  }

  getAll(): SavedView[] {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return [];

    const views = JSON.parse(stored);
    return views.map((v: any) => ({
      ...v,
      createdAt: new Date(v.createdAt),
    }));
  }

  getByPage(page: string): SavedView[] {
    return this.getAll().filter(v => v.page === page);
  }

  save(view: Omit<SavedView, 'id' | 'createdAt'>): SavedView {
    const newView: SavedView = {
      ...view,
      id: `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    const views = this.getAll();
    views.push(newView);
    localStorage.setItem(this.storageKey, JSON.stringify(views));

    this.emit('saved');
    return newView;
  }

  delete(id: string): void {
    const views = this.getAll().filter(v => v.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(views));
    this.emit('deleted');
  }

  update(id: string, updates: Partial<Omit<SavedView, 'id' | 'createdAt'>>): void {
    const views = this.getAll();
    const index = views.findIndex(v => v.id === id);
    if (index !== -1) {
      views[index] = { ...views[index], ...updates };
      localStorage.setItem(this.storageKey, JSON.stringify(views));
      this.emit('updated');
    }
  }

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb());
    }
  }
}

export const savedViewsService = SavedViewsService.getInstance();
