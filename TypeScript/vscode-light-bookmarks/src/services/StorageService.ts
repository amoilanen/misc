import * as vscode from 'vscode';
import { Bookmark, BookmarkJSON } from '../models/Bookmark';
import { Collection, CollectionJSON } from '../models/Collection';

export class StorageService {
  private globalState: vscode.Memento;

  constructor(globalState: vscode.Memento) {
    this.globalState = globalState;
  }

  public async saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
    const bookmarkData: BookmarkJSON[] = bookmarks.map(bookmark => bookmark.toJSON());
    await this.globalState.update('bookmarks', bookmarkData);
  }

  public async loadBookmarks(): Promise<Bookmark[]> {
    const bookmarkData: BookmarkJSON[] = this.globalState.get('bookmarks', []);
    return bookmarkData.map(data => Bookmark.fromJSON(data));
  }

  public async saveCollections(collections: Collection[]): Promise<void> {
    const collectionData: CollectionJSON[] = collections.map(collection => collection.toJSON());
    await this.globalState.update('collections', collectionData);
  }

  public async loadCollections(): Promise<Collection[]> {
    const collectionData: CollectionJSON[] = this.globalState.get('collections', []);
    return collectionData.map(data => Collection.fromJSON(data));
  }

  public async clearAllData(): Promise<void> {
    await this.globalState.update('bookmarks', []);
    await this.globalState.update('collections', []);
  }
} 