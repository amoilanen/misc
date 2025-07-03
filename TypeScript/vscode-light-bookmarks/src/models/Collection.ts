import { v4 as uuidv4 } from 'uuid';

export interface CollectionJSON {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export class Collection {
  public readonly id: string;
  public readonly name: string;
  public readonly color: string;
  public readonly createdAt: Date;

  constructor(name: string, color: string) {
    this.id = uuidv4();
    this.name = name;
    this.color = color;
    this.createdAt = new Date();
  }

  public toJSON(): CollectionJSON {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      createdAt: this.createdAt.toISOString(),
    };
  }

  public static fromJSON(json: CollectionJSON): Collection {
    const collection = new Collection(json.name, json.color);
    // Override the generated id and createdAt with the stored values
    Object.defineProperty(collection, 'id', { value: json.id, writable: false });
    Object.defineProperty(collection, 'createdAt', { value: new Date(json.createdAt), writable: false });
    return collection;
  }
} 