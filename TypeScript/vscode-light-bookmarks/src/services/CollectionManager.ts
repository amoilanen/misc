import { Collection } from '../models/Collection';

export class CollectionManager {
  private collections: Collection[] = [];

  public createCollection(name: string, workspaceId?: string): Collection | null {
    // Check if collection with same name already exists in the same workspace
    const existingCollection = this.collections.find(c => c.name === name && c.workspaceId === workspaceId);
    if (existingCollection) {
      return null;
    }

    const collection = new Collection(name, workspaceId);
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

  public getCollectionsForWorkspace(workspaceId?: string): Collection[] {
    return this.collections.filter(c => c.workspaceId === workspaceId);
  }

  public addCollection(collection: Collection): void {
    this.collections.push(collection);
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