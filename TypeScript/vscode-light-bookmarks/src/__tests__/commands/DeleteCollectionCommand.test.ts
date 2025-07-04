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
      refresh: jest.fn(),
      refreshRoot: jest.fn(),
      refreshCollection: jest.fn(),
      refreshUngrouped: jest.fn(),
      markCollectionExpanded: jest.fn(),
      markCollectionCollapsed: jest.fn(),
      markBookmarkExpanded: jest.fn(),
      markBookmarkCollapsed: jest.fn(),
      getExpandedCollections: jest.fn(),
      getExpandedBookmarks: jest.fn(),
      isCollectionExpanded: jest.fn(),
      isBookmarkExpanded: jest.fn(),
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

    it('should delete an empty collection immediately without confirmation', async () => {
      // Arrange
      const collection = collectionManager.createCollection('Test Collection');
      expect(collection).not.toBeNull();
      if (!collection) return;

      // Act
      await command.execute(collection.id);

      // Assert
      expect(vscode.window.showWarningMessage).not.toHaveBeenCalled();
      expect(collectionManager.getCollection(collection.id)).toBeUndefined();
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Collection "Test Collection" deleted successfully'
      );
      expect(storageService.saveCollections).toHaveBeenCalled();
      expect(treeDataProvider.refreshRoot).toHaveBeenCalled();
      expect(decorationProvider.updateDecorations).toHaveBeenCalled();
    });

    it('should show error when collection not found', async () => {
      // Act
      await command.execute('non-existent-id');

      // Assert
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Collection not found');
    });

    it('should handle collection with bookmarks - user confirms deletion', async () => {
      // Arrange
      const collection = collectionManager.createCollection('Test Collection');
      expect(collection).not.toBeNull();
      if (!collection) return;

      bookmarkManager.addBookmark('file:///test.ts', 10, collection.id);
      
      // Mock user confirmation
      (vscode.window.showWarningMessage as jest.Mock).mockResolvedValue('Delete');

      // Act
      await command.execute(collection.id);

      // Assert
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
        'Deleting collection will also delete bookmarks contained in it, proceed?',
        { modal: true },
        'Delete'
      );
      expect(collectionManager.getCollection(collection.id)).toBeUndefined();
      expect(bookmarkManager.getBookmark('file:///test.ts', 10)).toBeUndefined();
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Collection "Test Collection" deleted successfully'
      );
      expect(storageService.saveBookmarks).toHaveBeenCalled();
      expect(storageService.saveCollections).toHaveBeenCalled();
      expect(treeDataProvider.refreshRoot).toHaveBeenCalled();
      expect(decorationProvider.updateDecorations).toHaveBeenCalled();
    });

    it('should cancel deletion when user cancels', async () => {
      // Arrange
      const collection = collectionManager.createCollection('Test Collection');
      expect(collection).not.toBeNull();
      if (!collection) return;

      bookmarkManager.addBookmark('file:///test.ts', 10, collection.id);
      
      // Mock user cancellation
      (vscode.window.showWarningMessage as jest.Mock).mockResolvedValue('Cancel');

      // Act
      await command.execute(collection.id);

      // Assert
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
        'Deleting collection will also delete bookmarks contained in it, proceed?',
        { modal: true },
        'Delete'
      );
      expect(collectionManager.getCollection(collection.id)).toBeDefined();
      expect(bookmarkManager.getBookmark('file:///test.ts', 10)).toBeDefined();
      expect(storageService.saveCollections).not.toHaveBeenCalled();
      expect(treeDataProvider.refreshRoot).not.toHaveBeenCalled();
      expect(decorationProvider.updateDecorations).not.toHaveBeenCalled();
    });
  });
}); 