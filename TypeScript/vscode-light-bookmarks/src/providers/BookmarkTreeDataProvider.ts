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
      
      // Add hover actions for bookmark items with description
      const description = bookmark.description ? `\n\n**Description:** ${bookmark.description}` : '';
      this.tooltip = new vscode.MarkdownString(`${bookmark.uri}:${bookmark.line}${description}\n\n**Click to open**`);
      this.tooltip.isTrusted = true;
    } else if (collection) {
      this.tooltip = collection.name;
      this.iconPath = new vscode.ThemeIcon('folder');
      // Set different context value for "Ungrouped" collection to prevent deletion
      this.contextValue = collection.id === 'ungrouped-bookmarks' ? 'ungrouped-collection' : 'collection';
      // Add command arguments for context menu actions
      this.resourceUri = vscode.Uri.parse(`collection://${collection.id}`);
      
      // Add hover actions for collection items (only for non-ungrouped collections)
      if (collection.id !== 'ungrouped-bookmarks') {
        this.tooltip = new vscode.MarkdownString(`${collection.name}\n\n**Click to expand**`);
        this.tooltip.isTrusted = true;
      }
    }
  }
}

export class BookmarkTreeDataProvider implements vscode.TreeDataProvider<BookmarkTreeItem | CodeLineTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<BookmarkTreeItem | CodeLineTreeItem | undefined | null | void> = new vscode.EventEmitter<BookmarkTreeItem | CodeLineTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<BookmarkTreeItem | CodeLineTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
  
  private treeView: vscode.TreeView<BookmarkTreeItem | CodeLineTreeItem> | undefined;

  // Track expanded state for all tree levels
  private expandedCollections: Set<string> = new Set();
  private expandedBookmarks: Set<string> = new Set(); // key: `${uri}:${line}`

  constructor(
    private bookmarkManager: BookmarkManager,
    private collectionManager: CollectionManager
  ) {}

  public setTreeView(treeView: vscode.TreeView<BookmarkTreeItem | CodeLineTreeItem>): void {
    this.treeView = treeView;
  }

  // Methods to track expanded/collapsed state
  public markCollectionExpanded(collectionId: string): void {
    this.expandedCollections.add(collectionId);
  }

  public markCollectionCollapsed(collectionId: string): void {
    this.expandedCollections.delete(collectionId);
  }

  public markBookmarkExpanded(bookmarkKey: string): void {
    this.expandedBookmarks.add(bookmarkKey);
  }

  public markBookmarkCollapsed(bookmarkKey: string): void {
    this.expandedBookmarks.delete(bookmarkKey);
  }

  public getExpandedCollections(): string[] {
    return Array.from(this.expandedCollections);
  }

  public getExpandedBookmarks(): string[] {
    return Array.from(this.expandedBookmarks);
  }

  public isCollectionExpanded(collectionId: string): boolean {
    return this.expandedCollections.has(collectionId);
  }

  public isBookmarkExpanded(bookmarkKey: string): boolean {
    return this.expandedBookmarks.has(bookmarkKey);
  }

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Refresh only a specific element and its children, preserving expanded state
   */
  public refreshElement(element?: BookmarkTreeItem | CodeLineTreeItem): void {
    this._onDidChangeTreeData.fire(element);
  }

  /**
   * Refresh only the root level, preserving expanded state of collections
   */
  public refreshRoot(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  /**
   * Refresh a specific collection and its bookmarks, preserving expanded state
   */
  public refreshCollection(collection: Collection): void {
    const collectionItem = new BookmarkTreeItem(
      collection.name,
      vscode.TreeItemCollapsibleState.Collapsed,
      undefined,
      collection
    );
    this._onDidChangeTreeData.fire(collectionItem);
  }

  /**
   * Refresh the ungrouped bookmarks section, preserving expanded state
   */
  public refreshUngrouped(): void {
    const ungroupedItem = new BookmarkTreeItem(
      'Ungrouped',
      vscode.TreeItemCollapsibleState.Collapsed,
      undefined,
      { id: 'ungrouped-bookmarks', name: 'Ungrouped', createdAt: new Date() } as Collection
    );
    this._onDidChangeTreeData.fire(ungroupedItem);
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

  public async getRootItems(): Promise<BookmarkTreeItem[]> {
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
      
      // Set collapsible state based on whether it was previously expanded
      const collapsibleState = this.isCollectionExpanded(collection.id) 
        ? vscode.TreeItemCollapsibleState.Expanded 
        : (workspaceCollectionBookmarks.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
      
      items.push(
        new BookmarkTreeItem(
          `${collection.name} (${workspaceCollectionBookmarks.length})`,
          collapsibleState,
          undefined,
          collection
        )
      );
    }

    // Add ungrouped bookmarks
    if (ungroupedBookmarks.length > 0) {
      const collapsibleState = this.isCollectionExpanded('ungrouped-bookmarks')
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.Collapsed;
      
      items.push(
        new BookmarkTreeItem(
          `Ungrouped (${ungroupedBookmarks.length})`,
          collapsibleState,
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
      const bookmarkKey = `${bookmark.uri}:${bookmark.line}`;
      
      // Set collapsible state based on whether it was previously expanded
      const collapsibleState = this.isBookmarkExpanded(bookmarkKey)
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.Collapsed;
      
      return new BookmarkTreeItem(
        `${fileName}:${bookmark.line}`,
        collapsibleState,
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