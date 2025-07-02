import * as vscode from 'vscode';
import { BookmarkManager } from '../services/BookmarkManager';
import { CollectionManager } from '../services/CollectionManager';
import { Bookmark } from '../models/Bookmark';
import { Collection } from '../models/Collection';

export class BookmarkTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly bookmark?: Bookmark,
    public readonly collection?: Collection
  ) {
    super(label, collapsibleState);

    if (bookmark) {
      this.tooltip = `${bookmark.uri}:${bookmark.line}`;
      this.description = `Line ${bookmark.line}`;
      this.iconPath = new vscode.ThemeIcon('bookmark');
      this.contextValue = 'bookmark';
      this.command = {
        command: 'vscode.open',
        title: 'Open Bookmark',
        arguments: [
          vscode.Uri.parse(bookmark.uri),
          {
            selection: new vscode.Range(bookmark.line - 1, 0, bookmark.line - 1, 0),
          },
        ],
      };
    } else if (collection) {
      this.tooltip = collection.name;
      this.iconPath = new vscode.ThemeIcon('folder');
      this.contextValue = 'collection';
      this.description = `${collection.isVisible ? 'Visible' : 'Hidden'}`;
    }
  }
}

export class BookmarkTreeDataProvider implements vscode.TreeDataProvider<BookmarkTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<BookmarkTreeItem | undefined | null | void> = new vscode.EventEmitter<BookmarkTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<BookmarkTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(
    private bookmarkManager: BookmarkManager,
    private collectionManager: CollectionManager
  ) {}

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: BookmarkTreeItem): vscode.TreeItem {
    return element;
  }

  public getChildren(element?: BookmarkTreeItem): Thenable<BookmarkTreeItem[]> {
    if (!element) {
      // Root level - show collections and ungrouped bookmarks
      return this.getRootItems();
    } else if (element.collection) {
      // Collection level - show bookmarks in this collection
      return this.getCollectionBookmarks(element.collection);
    } else {
      // No children for bookmark items
      return Promise.resolve([]);
    }
  }

  private async getRootItems(): Promise<BookmarkTreeItem[]> {
    const items: BookmarkTreeItem[] = [];
    const collections = this.collectionManager.getVisibleCollections();
    const allBookmarks = this.bookmarkManager.getAllBookmarks();
    const ungroupedBookmarks = allBookmarks.filter(b => !b.collectionId);

    // Add collections
    for (const collection of collections) {
      const collectionBookmarks = this.bookmarkManager.getBookmarksByCollection(collection.id);
      if (collectionBookmarks.length > 0) {
        items.push(
          new BookmarkTreeItem(
            `${collection.name} (${collectionBookmarks.length})`,
            vscode.TreeItemCollapsibleState.Collapsed,
            undefined,
            collection
          )
        );
      }
    }

    // Add ungrouped bookmarks
    if (ungroupedBookmarks.length > 0) {
      items.push(
        new BookmarkTreeItem(
          `Ungrouped (${ungroupedBookmarks.length})`,
          vscode.TreeItemCollapsibleState.Collapsed,
          undefined,
          { id: 'ungrouped-bookmarks', name: 'Ungrouped', color: '#cccccc', isVisible: true, createdAt: new Date() } as Collection
        )
      );
    }

    return items;
  }

  private async getCollectionBookmarks(collection: Collection): Promise<BookmarkTreeItem[]> {
    let bookmarks: Bookmark[];

    if (collection.id === 'ungrouped-bookmarks') {
      bookmarks = this.bookmarkManager.getAllBookmarks().filter(b => !b.collectionId);
    } else {
      bookmarks = this.bookmarkManager.getBookmarksByCollection(collection.id);
    }

    return bookmarks.map(bookmark => {
      const fileName = this.getFileName(bookmark.uri);
      return new BookmarkTreeItem(
        `${fileName}:${bookmark.line}`,
        vscode.TreeItemCollapsibleState.None,
        bookmark
      );
    });
  }

  private getFileName(uri: string): string {
    try {
      const path = vscode.Uri.parse(uri).path;
      return path.split('/').pop() || 'Unknown';
    } catch {
      return 'Unknown';
    }
  }
} 