import { v4 as uuidv4 } from 'uuid';

export interface CollectionJSON {
  id: string;
  name: string;
  createdAt: string;
  workspaceId?: string;
}

export class Collection {
  public readonly id: string;
  public readonly name: string;
  public readonly createdAt: Date;
  public readonly workspaceId?: string;

  constructor(name: string, workspaceId?: string) {
    this.id = uuidv4();
    this.name = name;
    this.createdAt = new Date();
    this.workspaceId = workspaceId;
  }

  public toJSON(): CollectionJSON {
    return {
      id: this.id,
      name: this.name,
      createdAt: this.createdAt.toISOString(),
      workspaceId: this.workspaceId,
    };
  }

  public static fromJSON(json: CollectionJSON): Collection {
    const collection = new Collection(json.name, json.workspaceId);
    // Override the generated id and createdAt with the stored values
    Object.defineProperty(collection, 'id', { value: json.id, writable: false });
    Object.defineProperty(collection, 'createdAt', { value: new Date(json.createdAt), writable: false });
    return collection;
  }
} 