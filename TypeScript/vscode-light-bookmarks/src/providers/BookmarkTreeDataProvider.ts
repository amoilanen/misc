import * as vscode from 'vscode';
import { BookmarkManager } from '../services/BookmarkManager';
import { CollectionManager } from '../services/CollectionManager';
import { Bookmark } from '../models/Bookmark';
import { Collection } from '../models/Collection';

export class CodeLineTreeItem extends vscode.TreeItem {
  constructor(
    public readonly codeLine: string,
    public readonly lineNumber: number,
    public readonly bookmark: Bookmark
  ) {
    super(codeLine, vscode.TreeItemCollapsibleState.None);
    this.tooltip = `Line ${lineNumber}: ${codeLine}`;
    this.description = `Line ${lineNumber}`;
    this.contextValue = 'code-line';
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
  }
}

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
      this.iconPath = new vscode.ThemeIcon('bookmark');
      // Set different context values based on whether bookmark is in a collection
      this.contextValue = bookmark.collectionId ? 'bookmark-in-collection' : 'bookmark-ungrouped';
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
      // Add command arguments for context menu actions
      this.resourceUri = vscode.Uri.parse(`bookmark://${bookmark.uri}:${bookmark.line}`);
      
      // Add hover actions for bookmark items
      this.tooltip = new vscode.MarkdownString(`${bookmark.uri}:${bookmark.line}\n\n**Click to open** | **Hover for more actions**`);
      this.tooltip.isTrusted = true;
    } else if (collection) {
      this.tooltip = collection.name;
      this.iconPath = new vscode.ThemeIcon('folder');
      // Set different context value for "Ungrouped" collection to prevent deletion
      this.contextValue = collection.id === 'ungrouped-bookmarks' ? 'ungrouped-collection' : 'collection';
      // Add command arguments for context menu actions
      this.resourceUri = vscode.Uri.parse(`collection://${collection.id}`);
    }
  }
}

export class BookmarkTreeDataProvider implements vscode.TreeDataProvider<BookmarkTreeItem | CodeLineTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<BookmarkTreeItem | CodeLineTreeItem | undefined | null | void> = new vscode.EventEmitter<BookmarkTreeItem | CodeLineTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<BookmarkTreeItem | CodeLineTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(
    private bookmarkManager: BookmarkManager,
    private collectionManager: CollectionManager
  ) {}

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: BookmarkTreeItem | CodeLineTreeItem): vscode.TreeItem {
    return element;
  }

  public getChildren(element?: BookmarkTreeItem | CodeLineTreeItem): Thenable<(BookmarkTreeItem | CodeLineTreeItem)[]> {
    if (!element) {
      // Root level - show collections and ungrouped bookmarks
      return this.getRootItems();
    } else if ('collection' in element && element.collection) {
      // Collection level - show bookmarks in this collection
      return this.getCollectionBookmarks(element.collection);
    } else if ('bookmark' in element && element.bookmark) {
      // Bookmark level - show the code line
      return this.getBookmarkCodeLine(element.bookmark);
    } else {
      // No children for code line items
      return Promise.resolve([]);
    }
  }

  private async getRootItems(): Promise<BookmarkTreeItem[]> {
    const items: BookmarkTreeItem[] = [];
    const currentWorkspaceId = vscode.workspace.workspaceFolders?.[0]?.uri.toString();
    const collections = this.collectionManager.getCollectionsForWorkspace(currentWorkspaceId);
    const allBookmarks = this.bookmarkManager.getAllBookmarks();
    
    // Filter bookmarks to only include those from the current workspace
    const workspaceBookmarks = allBookmarks.filter(bookmark => this.isBookmarkInCurrentWorkspace(bookmark));
    const ungroupedBookmarks = workspaceBookmarks.filter(b => !b.collectionId);

    // Add all collections for the current workspace (including empty ones)
    for (const collection of collections) {
      const collectionBookmarks = this.bookmarkManager.getBookmarksByCollection(collection.id);
      const workspaceCollectionBookmarks = collectionBookmarks.filter(bookmark => this.isBookmarkInCurrentWorkspace(bookmark));
      
      items.push(
        new BookmarkTreeItem(
          `${collection.name} (${workspaceCollectionBookmarks.length})`,
          workspaceCollectionBookmarks.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
          undefined,
          collection
        )
      );
    }

    // Add ungrouped bookmarks
    if (ungroupedBookmarks.length > 0) {
      items.push(
        new BookmarkTreeItem(
          `Ungrouped (${ungroupedBookmarks.length})`,
          vscode.TreeItemCollapsibleState.Collapsed,
          undefined,
          { id: 'ungrouped-bookmarks', name: 'Ungrouped', createdAt: new Date() } as Collection
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

    // Filter bookmarks to only include those from the current workspace
    const workspaceBookmarks = bookmarks.filter(bookmark => this.isBookmarkInCurrentWorkspace(bookmark));

    return workspaceBookmarks.map(bookmark => {
      const fileName = this.getFileName(bookmark.uri);
      return new BookmarkTreeItem(
        `${fileName}:${bookmark.line}`,
        vscode.TreeItemCollapsibleState.Collapsed,
        bookmark
      );
    });
  }

  private async getBookmarkCodeLine(bookmark: Bookmark): Promise<CodeLineTreeItem[]> {
    try {
      const uri = vscode.Uri.parse(bookmark.uri);
      const document = await vscode.workspace.openTextDocument(uri);
      const line = document.lineAt(bookmark.line - 1); // Convert to 0-based index
      const codeLine = line.text.trim();
      
      return [new CodeLineTreeItem(codeLine, bookmark.line, bookmark)];
    } catch (error) {
      // If we can't read the file or line, return an error message
      return [new CodeLineTreeItem('Unable to read code line', bookmark.line, bookmark)];
    }
  }

  private isBookmarkInCurrentWorkspace(bookmark: Bookmark): boolean {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      // If no workspace is open, show all bookmarks
      return true;
    }

    try {
      const bookmarkUri = vscode.Uri.parse(bookmark.uri);
      
      // Check if the bookmark URI is within any of the current workspace folders
      return workspaceFolders.some(folder => {
        const folderUri = folder.uri;
        return bookmarkUri.scheme === folderUri.scheme && 
               bookmarkUri.authority === folderUri.authority &&
               bookmarkUri.path.startsWith(folderUri.path);
      });
    } catch {
      // If URI parsing fails, don't show the bookmark
      return false;
    }
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