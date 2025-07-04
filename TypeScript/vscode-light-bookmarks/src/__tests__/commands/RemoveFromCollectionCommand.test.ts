import { RemoveFromCollectionCommand } from '../../commands/RemoveFromCollectionCommand';
import { BookmarkManager } from '../../services/BookmarkManager';
import { CollectionManager } from '../../services/CollectionManager';
import { Collection } from '../../models/Collection';
import { StorageService } from '../../services/StorageService';
import { BookmarkTreeDataProvider } from '../../providers/BookmarkTreeDataProvider';
import { BookmarkDecorationProvider } from '../../providers/BookmarkDecorationProvider';
import * as vscode from 'vscode';

describe('RemoveFromCollectionCommand', () => {
  let command: RemoveFromCollectionCommand;
  let bookmarkManager: BookmarkManager;
  let collectionManager: CollectionManager;
  let storageService: StorageService;
  let treeDataProvider: BookmarkTreeDataProvider;
  let decorationProvider: BookmarkDecorationProvider;

  beforeEach(() => {
    bookmarkManager = new BookmarkManager();
    collectionManager = new CollectionManager();
    storageService = {
      saveBookmarks: jest.fn().mockResolvedValue(undefined)
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

    command = new RemoveFromCollectionCommand(
      bookmarkManager,
      collectionManager,
      storageService,
      treeDataProvider,
      decorationProvider
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should remove bookmark from collection when called with parameters', async () => {
      // Arrange
      const collection = collectionManager.createCollection('Test Collection');
      expect(collection).not.toBeNull();
      if (!collection) return;
      bookmarkManager.addBookmark('file:///test.ts', 10, collection.id);
      
      // Act
      await command.execute('file:///test.ts', 10);

      // Assert
      expect(bookmarkManager.getBookmark('file:///test.ts', 10)).toBeDefined();
      expect(bookmarkManager.getBookmark('file:///test.ts', 10)?.collectionId).toBeUndefined();
      expect(storageService.saveBookmarks).toHaveBeenCalled();
      expect(treeDataProvider.refreshCollection).toHaveBeenCalled();
      expect(treeDataProvider.refreshUngrouped).toHaveBeenCalled();
      expect(treeDataProvider.refreshRoot).toHaveBeenCalled();
      expect(decorationProvider.updateDecorations).toHaveBeenCalled();
    });

    it('should show error when bookmark is not in any collection', async () => {
      // Arrange
      bookmarkManager.addBookmark('file:///test.ts', 10); // No collection

      // Act
      await command.execute('file:///test.ts', 10);

      // Assert
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'This bookmark is not in any collection.'
      );
    });

    it('should show error when bookmark does not exist', async () => {
      // Act
      await command.execute('file:///test.ts', 10);

      // Assert
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'No bookmark found at current line.'
      );
    });

    it('should prevent removal from the "Ungrouped" collection', async () => {
      // Arrange
      // Create a mock collection with the ungrouped ID
      const ungroupedCollection = {
        id: 'ungrouped-bookmarks',
        name: 'Ungrouped',
        createdAt: new Date()
      };
      
      // Mock the collection manager to return the ungrouped collection
      jest.spyOn(collectionManager, 'getCollection').mockReturnValue(ungroupedCollection as Collection);
      
      // Add a bookmark with the ungrouped collection ID
      bookmarkManager.addBookmark('file:///test.ts', 10, 'ungrouped-bookmarks');
      
      // Act
      await command.execute('file:///test.ts', 10);

      // Assert
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Bookmarks cannot be removed from the "Ungrouped" collection. Use "Add to Collection" to move them to another collection.'
      );
      expect(storageService.saveBookmarks).not.toHaveBeenCalled();
      expect(treeDataProvider.refreshCollection).not.toHaveBeenCalled();
      expect(treeDataProvider.refreshUngrouped).not.toHaveBeenCalled();
      expect(treeDataProvider.refreshRoot).not.toHaveBeenCalled();
      expect(decorationProvider.updateDecorations).not.toHaveBeenCalled();
    });
  });
}); 