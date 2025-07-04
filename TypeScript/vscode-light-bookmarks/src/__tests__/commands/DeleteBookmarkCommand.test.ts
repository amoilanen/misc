import { DeleteBookmarkCommand } from '../../commands/DeleteBookmarkCommand';
import { BookmarkManager } from '../../services/BookmarkManager';
import { CollectionManager } from '../../services/CollectionManager';
import { StorageService } from '../../services/StorageService';
import { BookmarkTreeDataProvider } from '../../providers/BookmarkTreeDataProvider';
import { BookmarkDecorationProvider } from '../../providers/BookmarkDecorationProvider';
import { Bookmark } from '../../models/Bookmark';
import * as vscode from 'vscode';

// Mock vscode
jest.mock('vscode', () => ({
  window: {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    activeTextEditor: undefined,
  },
}));

describe('DeleteBookmarkCommand', () => {
  let command: DeleteBookmarkCommand;
  let bookmarkManager: BookmarkManager;
  let collectionManager: CollectionManager;
  let storageService: StorageService;
  let treeDataProvider: BookmarkTreeDataProvider;
  let decorationProvider: BookmarkDecorationProvider;

  beforeEach(() => {
    bookmarkManager = new BookmarkManager();
    collectionManager = new CollectionManager();
    storageService = {
      saveBookmarks: jest.fn(),
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
      updateDecorations: jest.fn(),
    } as unknown as BookmarkDecorationProvider;

    command = new DeleteBookmarkCommand(
      bookmarkManager,
      collectionManager,
      storageService,
      treeDataProvider,
      decorationProvider
    );

    // Mock vscode.window methods
    (vscode.window.showInformationMessage as jest.Mock) = jest.fn();
    (vscode.window.showErrorMessage as jest.Mock) = jest.fn();
  });

  describe('execute', () => {
    it('should delete bookmark when called with specific parameters', async () => {
      const bookmark = new Bookmark('file:///test.ts', 5);
      bookmarkManager.addBookmark(bookmark.uri, bookmark.line);

      await command.execute(bookmark.uri, bookmark.line);

      expect(bookmarkManager.getAllBookmarks()).toHaveLength(0);
      expect(storageService.saveBookmarks).toHaveBeenCalled();
      expect(treeDataProvider.refreshUngrouped).toHaveBeenCalled();
      expect(treeDataProvider.refreshRoot).toHaveBeenCalled();
    });

    it('should show error message when bookmark not found', async () => {
      const showInformationMessage = jest.fn();
      (vscode.window.showInformationMessage as jest.Mock) = showInformationMessage;

      await command.execute('file:///test.ts', 5);

      expect(showInformationMessage).toHaveBeenCalledWith('No bookmark found at the specified location.');
      expect(storageService.saveBookmarks).not.toHaveBeenCalled();
    });

    it('should handle bookmark removal failure', async () => {
      // Arrange
      const bookmark = bookmarkManager.addBookmark('file:///test.ts', 10);
      expect(bookmark).not.toBeNull();
      if (!bookmark) return;

      // Mock bookmarkManager.removeBookmark to return false
      jest.spyOn(bookmarkManager, 'removeBookmark').mockReturnValue(false);

      // Act
      await command.execute('file:///test.ts', 10);

      // Assert
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        'Failed to delete bookmark'
      );
      expect(storageService.saveBookmarks).not.toHaveBeenCalled();
      expect(treeDataProvider.refresh).not.toHaveBeenCalled();
      expect(decorationProvider.updateDecorations).not.toHaveBeenCalled();
    });
  });
}); 