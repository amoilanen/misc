import { Collection } from '../models/Collection';

export class CollectionManager {
  private collections: Collection[] = [];

  public createCollection(name: string, color: string): Collection | null {
    // Check if collection with same name already exists
    const existingCollection = this.collections.find(c => c.name === name);
    if (existingCollection) {
      return null;
    }

    const collection = new Collection(name, color);
    this.collections.push(collection);
    return collection;
  }

  public deleteCollection(id: string): boolean {
    const index = this.collections.findIndex(c => c.id === id);
    if (index === -1) {
      return false;
    }

    this.collections.splice(index, 1);
    return true;
  }

  public getCollection(id: string): Collection | undefined {
    return this.collections.find(c => c.id === id);
  }

  public getCollectionByName(name: string): Collection | undefined {
    return this.collections.find(c => c.name === name);
  }

  public getAllCollections(): Collection[] {
    return [...this.collections];
  }

  public getVisibleCollections(): Collection[] {
    return this.collections.filter(c => c.isVisible);
  }

  public clearAllCollections(): void {
    this.collections = [];
  }

  public hasCollection(id: string): boolean {
    return this.collections.some(c => c.id === id);
  }

  public hasCollectionByName(name: string): boolean {
    return this.collections.some(c => c.name === name);
  }
} 