import { v4 as uuidv4 } from 'uuid';

export interface BookmarkJSON {
  id: string;
  uri: string;
  line: number;
  collectionId?: string;
  createdAt: string;
}

export class Bookmark {
  public readonly id: string;
  public readonly uri: string;
  public readonly line: number;
  public readonly collectionId?: string;
  public readonly createdAt: Date;

  constructor(uri: string, line: number, collectionId?: string) {
    this.id = uuidv4();
    this.uri = uri;
    this.line = line;
    this.collectionId = collectionId;
    this.createdAt = new Date();
  }

  public equals(other: Bookmark): boolean {
    return this.uri === other.uri && this.line === other.line;
  }

  public toJSON(): BookmarkJSON {
    return {
      id: this.id,
      uri: this.uri,
      line: this.line,
      collectionId: this.collectionId,
      createdAt: this.createdAt.toISOString(),
    };
  }

  public static fromJSON(json: BookmarkJSON): Bookmark {
    const bookmark = new Bookmark(json.uri, json.line, json.collectionId);
    // Override the generated id and createdAt with the stored values
    Object.defineProperty(bookmark, 'id', { value: json.id, writable: false });
    Object.defineProperty(bookmark, 'createdAt', { value: new Date(json.createdAt), writable: false });
    return bookmark;
  }
} 