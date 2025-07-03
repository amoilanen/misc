import * as vscode from 'vscode';
import { BookmarkManager } from './services/BookmarkManager';
import { CollectionManager } from './services/CollectionManager';
import { StorageService } from './services/StorageService';
import { BookmarkTreeDataProvider, BookmarkTreeItem } from './providers/BookmarkTreeDataProvider';
import { BookmarkDecorationProvider } from './providers/BookmarkDecorationProvider';
import { ToggleBookmarkCommand } from './commands/ToggleBookmarkCommand';
import { AddToCollectionCommand } from './commands/AddToCollectionCommand';
import { RemoveFromCollectionCommand } from './commands/RemoveFromCollectionCommand';
import { CreateCollectionCommand } from './commands/CreateCollectionCommand';
import { DeleteCollectionCommand } from './commands/DeleteCollectionCommand';

export class ExtensionManager {
  private bookmarkManager: BookmarkManager;
  private collectionManager: CollectionManager;
  private storageService: StorageService;
  private treeDataProvider: BookmarkTreeDataProvider;
  private decorationProvider: BookmarkDecorationProvider;
  private disposables: vscode.Disposable[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.bookmarkManager = new BookmarkManager();
    this.collectionManager = new CollectionManager();
    this.storageService = new StorageService(context.globalState);
    this.treeDataProvider = new BookmarkTreeDataProvider(
      this.bookmarkManager,
      this.collectionManager
    );
    this.decorationProvider = new BookmarkDecorationProvider(
      this.bookmarkManager,
      this.collectionManager
    );
    
    // Set up bookmark change notification
    this.bookmarkManager.setOnBookmarksChanged(() => {
      this.decorationProvider.updateDecorations();
    });
  }

  public async initialize(): Promise<void> {
    // Load saved data
    const [bookmarks, collections] = await Promise.all([
      this.storageService.loadBookmarks(),
      this.storageService.loadCollections(),
    ]);

    // Restore bookmarks and collections
    bookmarks.forEach(bookmark => {
      this.bookmarkManager.addBookmark(bookmark.uri, bookmark.line, bookmark.collectionId);
    });

    collections.forEach(collection => {
      this.collectionManager.createCollection(collection.name, collection.color);
    });

    // Register tree data provider
    const treeView = vscode.window.createTreeView(
      'lightBookmarks.bookmarksView',
      {
        treeDataProvider: this.treeDataProvider
      }
    );
    this.disposables.push(treeView);

    // Register commands
    this.registerCommands();

    // Register event listeners
    this.registerEventListeners();

    // Refresh tree view and decorations
    this.treeDataProvider.refresh();
    this.decorationProvider.updateDecorations();
  }

  private registerCommands(): void {
    // Toggle bookmark command
    const toggleCommand = vscode.commands.registerCommand(
      'lightBookmarks.toggleBookmark',
      () => {
        const command = new ToggleBookmarkCommand(
          this.bookmarkManager,
          this.storageService,
          this.treeDataProvider,
          this.decorationProvider
        );
        command.execute();
      }
    );
    this.disposables.push(toggleCommand);

    // Add to collection command
    const addToCollectionCommand = vscode.commands.registerCommand(
      'lightBookmarks.addToCollection',
      (_treeItem?: BookmarkTreeItem) => {
        const command = new AddToCollectionCommand(
          this.bookmarkManager,
          this.collectionManager,
          this.storageService,
          this.treeDataProvider,
          this.decorationProvider
        );
        command.execute();
      }
    );
    this.disposables.push(addToCollectionCommand);

    // Remove from collection command
    const removeFromCollectionCommand = vscode.commands.registerCommand(
      'lightBookmarks.removeFromCollection',
      (treeItem?: BookmarkTreeItem) => {
        let bookmarkUri: string | undefined;
        let bookmarkLine: number | undefined;

        if (treeItem?.bookmark) {
          bookmarkUri = treeItem.bookmark.uri;
          bookmarkLine = treeItem.bookmark.line;
        }

        const command = new RemoveFromCollectionCommand(
          this.bookmarkManager,
          this.collectionManager,
          this.storageService,
          this.treeDataProvider,
          this.decorationProvider
        );
        command.execute(bookmarkUri, bookmarkLine);
      }
    );
    this.disposables.push(removeFromCollectionCommand);

    // Create collection command
    const createCollectionCommand = vscode.commands.registerCommand(
      'lightBookmarks.createCollection',
      () => {
        const command = new CreateCollectionCommand(
          this.collectionManager,
          this.storageService,
          this.treeDataProvider
        );
        command.execute();
      }
    );
    this.disposables.push(createCollectionCommand);

    // Delete collection command
    const deleteCollectionCommand = vscode.commands.registerCommand(
      'lightBookmarks.deleteCollection',
      (treeItem?: BookmarkTreeItem) => {
        let collectionId: string | undefined;

        if (treeItem?.collection) {
          collectionId = treeItem.collection.id;
        }

        if (collectionId) {
          const command = new DeleteCollectionCommand(
            this.collectionManager,
            this.bookmarkManager,
            this.storageService,
            this.treeDataProvider,
            this.decorationProvider
          );
          command.execute(collectionId);
        }
      }
    );
    this.disposables.push(deleteCollectionCommand);
  }

  private registerEventListeners(): void {
    // Update decorations when active editor changes
    const onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        this.decorationProvider.updateDecorations(editor);
      }
    });
    this.disposables.push(onDidChangeActiveTextEditor);

    // Update decorations when text document changes (in case bookmarks are affected)
    const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument((event) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document === event.document) {
        this.decorationProvider.updateDecorations(editor);
      }
    });
    this.disposables.push(onDidChangeTextDocument);
  }

  public dispose(): void {
    this.disposables.forEach(disposable => disposable.dispose());
    this.decorationProvider.dispose();
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const extensionManager = new ExtensionManager(context);
  
  context.subscriptions.push(
    vscode.Disposable.from(extensionManager)
  );

  extensionManager.initialize().catch(error => {
    console.error('Failed to initialize Light Bookmarks extension:', error);
    vscode.window.showErrorMessage('Failed to initialize Light Bookmarks extension');
  });
}

export function deactivate(): void {
  // Cleanup is handled by the ExtensionManager dispose method
} 