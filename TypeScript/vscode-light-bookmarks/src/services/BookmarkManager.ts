import { Bookmark } from '../models/Bookmark';

export class BookmarkManager {
  private bookmarks: Bookmark[] = [];
  private onBookmarksChanged: (() => void) | null = null;

  public addBookmark(uri: string, line: number, collectionId?: string, description?: string): Bookmark | null {
    // Check if bookmark already exists
    const existingBookmark = this.bookmarks.find(b => b.uri === uri && b.line === line);
    if (existingBookmark) {
      return null;
    }

    const bookmark = new Bookmark(uri, line, collectionId, description);
    this.bookmarks.push(bookmark);
    this.notifyBookmarksChanged();
    return bookmark;
  }

  public updateBookmarkDescription(uri: string, line: number, description: string): boolean {
    const bookmark = this.bookmarks.find(b => b.uri === uri && b.line === line);
    if (!bookmark) {
      return false;
    }

    bookmark.description = description;
    this.notifyBookmarksChanged();
    return true;
  }

  public getBookmarkDescription(uri: string, line: number): string | undefined {
    const bookmark = this.bookmarks.find(b => b.uri === uri && b.line === line);
    return bookmark?.description;
  }

  public removeBookmark(uri: string, line: number): boolean {
    const index = this.bookmarks.findIndex(b => b.uri === uri && b.line === line);
    if (index === -1) {
      return false;
    }

    this.bookmarks.splice(index, 1);
    this.notifyBookmarksChanged();
    return true;
  }

  public toggleBookmark(uri: string, line: number, collectionId?: string): Bookmark | null {
    const existingBookmark = this.bookmarks.find(b => b.uri === uri && b.line === line);
    
    if (existingBookmark) {
      this.removeBookmark(uri, line);
      return null;
    } else {
      return this.addBookmark(uri, line, collectionId);
    }
  }

  public getBookmarksByUri(uri: string): Bookmark[] {
    return this.bookmarks.filter(b => b.uri === uri);
  }

  public getBookmarksByCollection(collectionId: string): Bookmark[] {
    return this.bookmarks.filter(b => b.collectionId === collectionId);
  }

  public getAllBookmarks(): Bookmark[] {
    return [...this.bookmarks];
  }

  public clearAllBookmarks(): void {
    this.bookmarks = [];
    this.notifyBookmarksChanged();
  }

  public hasBookmark(uri: string, line: number): boolean {
    return this.bookmarks.some(b => b.uri === uri && b.line === line);
  }

  public getBookmark(uri: string, line: number): Bookmark | undefined {
    return this.bookmarks.find(b => b.uri === uri && b.line === line);
  }

  public setOnBookmarksChanged(callback: () => void): void {
    this.onBookmarksChanged = callback;
  }

  private notifyBookmarksChanged(): void {
    if (this.onBookmarksChanged) {
      this.onBookmarksChanged();
    }
  }
} 