import * as vscode from 'vscode';
import { DeleteBookmarkCommand } from '../../commands/DeleteBookmarkCommand';
import { BookmarkManager } from '../../services/BookmarkManager';
import { StorageService } from '../../services/StorageService';
import { BookmarkTreeDataProvider } from '../../providers/BookmarkTreeDataProvider';
import { BookmarkDecorationProvider } from '../../providers/BookmarkDecorationProvider';

// Mock vscode
jest.mock('vscode');

// Define interfaces for mocked services
interface MockStorageService {
  saveBookmarks: jest.Mock<Promise<void>, [import('../../models/Bookmark').Bookmark[]]>;
}

interface MockBookmarkTreeDataProvider {
  refresh: jest.Mock<void, []>;
}

interface MockBookmarkDecorationProvider {
  updateDecorations: jest.Mock<void, [vscode.TextEditor?]>;
}

describe('DeleteBookmarkCommand', () => {
  let command: DeleteBookmarkCommand;
  let bookmarkManager: BookmarkManager;
  let storageService: MockStorageService;
  let treeDataProvider: MockBookmarkTreeDataProvider;
  let decorationProvider: MockBookmarkDecorationProvider;

  beforeEach(() => {
    bookmarkManager = new BookmarkManager();
    storageService = {
      saveBookmarks: jest.fn().mockResolvedValue(undefined),
    };
    treeDataProvider = {
      refresh: jest.fn(),
    };
    decorationProvider = {
      updateDecorations: jest.fn(),
    };

    command = new DeleteBookmarkCommand(
      bookmarkManager,
      storageService as unknown as StorageService,
      treeDataProvider as unknown as BookmarkTreeDataProvider,
      decorationProvider as unknown as BookmarkDecorationProvider
    );

    // Mock vscode.window.showWarningMessage
    (vscode.window.showWarningMessage as jest.Mock) = jest.fn();
    (vscode.window.showInformationMessage as jest.Mock) = jest.fn();
    (vscode.window.showErrorMessage as jest.Mock) = jest.fn();
  });

  describe('execute', () => {
    it('should delete bookmark when called with parameters and user confirms', async () => {
      // Arrange
      const bookmark = bookmarkManager.addBookmark('file:///test.ts', 10);
      expect(bookmark).not.toBeNull();
      if (!bookmark) return;

      // Mock user confirmation
      (vscode.window.showWarningMessage as jest.Mock).mockResolvedValue('Delete');

      // Act
      await command.execute('file:///test.ts', 10);

      // Assert
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
        'Are you sure you want to delete the bookmark at test.ts:10?',
        { modal: true },
        'Delete'
      );
      expect(bookmarkManager.getBookmark('file:///test.ts', 10)).toBeUndefined();
      expect(storageService.saveBookmarks).toHaveBeenCalled();
      expect(treeDataProvider.refresh).toHaveBeenCalled();
      expect(decorationProvider.updateDecorations).toHaveBeenCalled();
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Bookmark deleted from line 10'
      );
    });

    it('should not delete bookmark when user cancels', async () => {
      // Arrange
      const bookmark = bookmarkManager.addBookmark('file:///test.ts', 10);
      expect(bookmark).not.toBeNull();
      if (!bookmark) return;

      // Mock user cancellation
      (vscode.window.showWarningMessage as jest.Mock).mockResolvedValue('Cancel');

      // Act
      await command.execute('file:///test.ts', 10);

      // Assert
      expect(bookmarkManager.getBookmark('file:///test.ts', 10)).toBeDefined();
      expect(storageService.saveBookmarks).not.toHaveBeenCalled();
      expect(treeDataProvider.refresh).not.toHaveBeenCalled();
      expect(decorationProvider.updateDecorations).not.toHaveBeenCalled();
    });

    it('should show error when bookmark does not exist', async () => {
      // Act
      await command.execute('file:///test.ts', 10);

      // Assert
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'No bookmark found at the specified location.'
      );
      expect(vscode.window.showWarningMessage).not.toHaveBeenCalled();
    });

    it('should handle bookmark removal failure', async () => {
      // Arrange
      const bookmark = bookmarkManager.addBookmark('file:///test.ts', 10);
      expect(bookmark).not.toBeNull();
      if (!bookmark) return;

      // Mock user confirmation
      (vscode.window.showWarningMessage as jest.Mock).mockResolvedValue('Delete');

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