import { DeleteCollectionCommand } from '../../commands/DeleteCollectionCommand';
import { CollectionManager } from '../../services/CollectionManager';
import { BookmarkManager } from '../../services/BookmarkManager';
import { StorageService } from '../../services/StorageService';
import { BookmarkTreeDataProvider } from '../../providers/BookmarkTreeDataProvider';
import { BookmarkDecorationProvider } from '../../providers/BookmarkDecorationProvider';
import * as vscode from 'vscode';

describe('DeleteCollectionCommand', () => {
  let command: DeleteCollectionCommand;
  let collectionManager: CollectionManager;
  let bookmarkManager: BookmarkManager;
  let storageService: StorageService;
  let treeDataProvider: BookmarkTreeDataProvider;
  let decorationProvider: BookmarkDecorationProvider;

  beforeEach(() => {
    collectionManager = new CollectionManager();
    bookmarkManager = new BookmarkManager();
    storageService = {
      saveBookmarks: jest.fn().mockResolvedValue(undefined),
      saveCollections: jest.fn().mockResolvedValue(undefined)
    } as unknown as StorageService;
    treeDataProvider = {
      refresh: jest.fn()
    } as unknown as BookmarkTreeDataProvider;
    decorationProvider = {
      updateDecorations: jest.fn()
    } as unknown as BookmarkDecorationProvider;

    command = new DeleteCollectionCommand(
      collectionManager,
      bookmarkManager,
      storageService,
      treeDataProvider,
      decorationProvider
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should prevent deletion of the "Ungrouped" collection', async () => {
      // Act
      await command.execute('ungrouped-bookmarks');

      // Assert
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        'The "Ungrouped" collection cannot be deleted'
      );
      expect(collectionManager.getAllCollections()).toHaveLength(0);
    });

    it('should delete a regular collection successfully', async () => {
      // Arrange
      const collection = collectionManager.createCollection('Test Collection', '#ff0000');
      expect(collection).not.toBeNull();
      if (!collection) return;

      // Mock user choice to delete bookmarks
      (vscode.window.showWarningMessage as jest.Mock).mockResolvedValue('Delete Bookmarks');

      // Act
      await command.execute(collection.id);

      // Assert
      expect(collectionManager.getCollection(collection.id)).toBeUndefined();
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Collection "Test Collection" deleted successfully'
      );
      expect(storageService.saveCollections).toHaveBeenCalled();
      expect(treeDataProvider.refresh).toHaveBeenCalled();
      expect(decorationProvider.updateDecorations).toHaveBeenCalled();
    });

    it('should show error when collection not found', async () => {
      // Act
      await command.execute('non-existent-id');

      // Assert
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Collection not found');
    });

    it('should handle collection with bookmarks - delete option', async () => {
      // Arrange
      const collection = collectionManager.createCollection('Test Collection', '#ff0000');
      expect(collection).not.toBeNull();
      if (!collection) return;

      bookmarkManager.addBookmark('file:///test.ts', 10, collection.id);
      
      // Mock user choice to delete bookmarks
      (vscode.window.showWarningMessage as jest.Mock).mockResolvedValue('Delete Bookmarks');

      // Act
      await command.execute(collection.id);

      // Assert
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
        'Collection "Test Collection" contains 1 bookmark(s). What would you like to do?',
        { modal: true },
        'Delete Bookmarks',
        'Ungroup Bookmarks',
        'Cancel'
      );
      expect(collectionManager.getCollection(collection.id)).toBeUndefined();
      expect(bookmarkManager.getBookmark('file:///test.ts', 10)).toBeUndefined();
    });

    it('should handle collection with bookmarks - ungroup option', async () => {
      // Arrange
      const collection = collectionManager.createCollection('Test Collection', '#ff0000');
      expect(collection).not.toBeNull();
      if (!collection) return;

      bookmarkManager.addBookmark('file:///test.ts', 10, collection.id);
      
      // Mock user choice to ungroup bookmarks
      (vscode.window.showWarningMessage as jest.Mock).mockResolvedValue('Ungroup Bookmarks');

      // Act
      await command.execute(collection.id);

      // Assert
      expect(collectionManager.getCollection(collection.id)).toBeUndefined();
      const bookmark = bookmarkManager.getBookmark('file:///test.ts', 10);
      expect(bookmark).toBeDefined();
      expect(bookmark?.collectionId).toBeUndefined();
    });

    it('should cancel deletion when user cancels', async () => {
      // Arrange
      const collection = collectionManager.createCollection('Test Collection', '#ff0000');
      expect(collection).not.toBeNull();
      if (!collection) return;

      bookmarkManager.addBookmark('file:///test.ts', 10, collection.id);
      
      // Mock user choice to cancel
      (vscode.window.showWarningMessage as jest.Mock).mockResolvedValue('Cancel');

      // Act
      await command.execute(collection.id);

      // Assert
      expect(collectionManager.getCollection(collection.id)).toBeDefined();
      expect(storageService.saveCollections).not.toHaveBeenCalled();
    });
  });
}); 