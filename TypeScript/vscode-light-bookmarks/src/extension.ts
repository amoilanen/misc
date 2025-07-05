import * as vscode from 'vscode';
import { BookmarkManager } from './services/BookmarkManager';
import { CollectionManager } from './services/CollectionManager';
import { StorageService } from './services/StorageService';
import { BookmarkTreeDataProvider, BookmarkTreeItem } from './providers/BookmarkTreeDataProvider';
import { BookmarkDecorationProvider } from './providers/BookmarkDecorationProvider';
import { ToggleBookmarkCommand } from './commands/ToggleBookmarkCommand';
import { AddToCollectionCommand } from './commands/AddToCollectionCommand';
import { AddBookmarkToCollectionCommand } from './commands/AddBookmarkToCollectionCommand';
import { DeleteCollectionCommand } from './commands/DeleteCollectionCommand';
import { DeleteBookmarkCommand } from './commands/DeleteBookmarkCommand';
import { EditBookmarkDescriptionCommand } from './commands/EditBookmarkDescriptionCommand';
import { Collection } from './models/Collection';




export class ExtensionManager {
  private bookmarkManager: BookmarkManager;
  private collectionManager: CollectionManager;
  private storageService: StorageService;
  private treeDataProvider: BookmarkTreeDataProvider;
  private decorationProvider: BookmarkDecorationProvider;
    private disposables: vscode.Disposable[] = [];
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
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
      // Restore the collection with its original workspace ID
      const restoredCollection = new Collection(collection.name, collection.workspaceId);
      // Override the generated id and createdAt with the stored values
      Object.defineProperty(restoredCollection, 'id', { value: collection.id, writable: false });
      Object.defineProperty(restoredCollection, 'createdAt', { value: collection.createdAt, writable: false });
      this.collectionManager.addCollection(restoredCollection);
    });

    // Register tree data provider
    const treeView = vscode.window.createTreeView(
      'lightBookmarks.bookmarksView',
      {
        treeDataProvider: this.treeDataProvider
      }
    );
    this.disposables.push(treeView);
    
    // Set the tree view reference in the provider for selective refresh
    this.treeDataProvider.setTreeView(treeView);

    // Track expanded/collapsed state for collections and bookmarks
    treeView.onDidExpandElement(e => {
      const item = e.element;
      if (item instanceof BookmarkTreeItem) {
        if (item.collection) {
          this.treeDataProvider.markCollectionExpanded(item.collection.id);
        } else if (item.bookmark) {
          const bookmarkKey = `${item.bookmark.uri}:${item.bookmark.line}`;
          this.treeDataProvider.markBookmarkExpanded(bookmarkKey);
        }
      }
    });
    
    treeView.onDidCollapseElement(e => {
      const item = e.element;
      if (item instanceof BookmarkTreeItem) {
        if (item.collection) {
          this.treeDataProvider.markCollectionCollapsed(item.collection.id);
        } else if (item.bookmark) {
          const bookmarkKey = `${item.bookmark.uri}:${item.bookmark.line}`;
          this.treeDataProvider.markBookmarkCollapsed(bookmarkKey);
        }
      }
    });

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
          this.collectionManager,
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

    // Add bookmark to collection command (for tree view items)
    const addBookmarkToCollectionCommand = vscode.commands.registerCommand(
      'lightBookmarks.addBookmarkToCollection',
      (treeItem?: BookmarkTreeItem) => {
        const command = new AddBookmarkToCollectionCommand(
          this.bookmarkManager,
          this.collectionManager,
          this.storageService,
          this.treeDataProvider,
          this.decorationProvider
        );
        command.execute(treeItem);
      }
    );
    this.disposables.push(addBookmarkToCollectionCommand);



    // Create collection command
    const createCollectionCommand = vscode.commands.registerCommand(
      'lightBookmarks.createCollection',
      async () => {
        const collectionName = await vscode.window.showInputBox({
          title: 'Create New Collection',
          placeHolder: 'Enter collection name',
          prompt: 'Please enter a name for the new collection',
          validateInput: (value) => {
            if (!value || value.trim().length === 0) {
              return 'Collection name cannot be empty';
            }
            const workspaceId = vscode.workspace.workspaceFolders?.[0]?.uri.toString();
            const existingCollection = this.collectionManager.getCollectionsForWorkspace(workspaceId)
              .find(c => c.name === value.trim());
            if (existingCollection) {
              return 'A collection with this name already exists in this workspace';
            }
            return null;
          }
        });

        if (!collectionName) {
          return; // User cancelled
        }

        const trimmedName = collectionName.trim();
        const workspaceId = vscode.workspace.workspaceFolders?.[0]?.uri.toString();
        const collection = this.collectionManager.createCollection(trimmedName, workspaceId);
        
        if (collection) {
          await this.storageService.saveCollections(this.collectionManager.getAllCollections());
          this.treeDataProvider.refreshRoot();
          vscode.window.showInformationMessage(`Collection "${trimmedName}" created successfully`);
        } else {
          vscode.window.showErrorMessage('Failed to create collection');
        }
      }
    );
    this.disposables.push(createCollectionCommand);

    // Edit bookmark description command
    const editBookmarkDescriptionCommand = vscode.commands.registerCommand(
      'lightBookmarks.editBookmarkDescription',
      (treeItem?: BookmarkTreeItem) => {
        const command = new EditBookmarkDescriptionCommand(
          this.bookmarkManager,
          this.collectionManager,
          this.storageService,
          this.treeDataProvider,
          this.decorationProvider
        );
        command.execute(treeItem);
      }
    );
    this.disposables.push(editBookmarkDescriptionCommand);

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

    // Delete bookmark command
    const deleteBookmarkCommand = vscode.commands.registerCommand(
      'lightBookmarks.deleteBookmark',
      (treeItem?: BookmarkTreeItem) => {
        let bookmarkUri: string | undefined;
        let bookmarkLine: number | undefined;

        if (treeItem?.bookmark) {
          bookmarkUri = treeItem.bookmark.uri;
          bookmarkLine = treeItem.bookmark.line;
        }

        if (bookmarkUri && bookmarkLine !== undefined) {
          const command = new DeleteBookmarkCommand(
            this.bookmarkManager,
            this.collectionManager,
            this.storageService,
            this.treeDataProvider,
            this.decorationProvider
          );
          command.execute(bookmarkUri, bookmarkLine);
        }
      }
    );
    this.disposables.push(deleteBookmarkCommand);
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

    // Refresh tree view and decorations when workspace folders change
    const onDidChangeWorkspaceFolders = vscode.workspace.onDidChangeWorkspaceFolders(() => {
      this.treeDataProvider.refresh();
      this.decorationProvider.updateDecorations();
    });
    this.disposables.push(onDidChangeWorkspaceFolders);
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