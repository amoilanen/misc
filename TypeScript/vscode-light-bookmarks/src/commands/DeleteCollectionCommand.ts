import * as vscode from 'vscode';
import { CollectionManager } from '../services/CollectionManager';
import { BookmarkManager } from '../services/BookmarkManager';
import { StorageService } from '../services/StorageService';
import { BookmarkTreeDataProvider } from '../providers/BookmarkTreeDataProvider';
import { BookmarkDecorationProvider } from '../providers/BookmarkDecorationProvider';

export class DeleteCollectionCommand {
  constructor(
    private collectionManager: CollectionManager,
    private bookmarkManager: BookmarkManager,
    private storageService: StorageService,
    private treeDataProvider: BookmarkTreeDataProvider,
    private decorationProvider: BookmarkDecorationProvider
  ) {}

  public async execute(collectionId: string): Promise<void> {
    const collection = this.collectionManager.getCollection(collectionId);
    if (!collection) {
      vscode.window.showErrorMessage('Collection not found');
      return;
    }

    // Get bookmarks in this collection
    const bookmarksInCollection = this.bookmarkManager.getBookmarksByCollection(collectionId);
    
    // Ask user what to do with bookmarks in the collection
    let action: 'delete' | 'ungroup' | 'cancel' = 'cancel';
    
    if (bookmarksInCollection.length > 0) {
      const result = await vscode.window.showWarningMessage(
        `Collection "${collection.name}" contains ${bookmarksInCollection.length} bookmark(s). What would you like to do?`,
        { modal: true },
        'Delete Bookmarks',
        'Ungroup Bookmarks',
        'Cancel'
      );

      if (result === 'Delete Bookmarks') {
        action = 'delete';
      } else if (result === 'Ungroup Bookmarks') {
        action = 'ungroup';
      } else {
        action = 'cancel';
      }
    }

    if (action === 'cancel') {
      return;
    }

    // Handle bookmarks based on user choice
    if (action === 'delete') {
      // Remove all bookmarks in the collection
      bookmarksInCollection.forEach(bookmark => {
        this.bookmarkManager.removeBookmark(bookmark.uri, bookmark.line);
      });
    } else if (action === 'ungroup') {
      // Remove collection ID from bookmarks (make them ungrouped)
      bookmarksInCollection.forEach(bookmark => {
        this.bookmarkManager.removeBookmark(bookmark.uri, bookmark.line);
        this.bookmarkManager.addBookmark(bookmark.uri, bookmark.line); // Add back without collection
      });
    }

    // Delete the collection
    const deleted = this.collectionManager.deleteCollection(collectionId);
    if (deleted) {
      vscode.window.showInformationMessage(`Collection "${collection.name}" deleted successfully`);
      
      // Save to storage
      await Promise.all([
        this.storageService.saveBookmarks(this.bookmarkManager.getAllBookmarks()),
        this.storageService.saveCollections(this.collectionManager.getAllCollections())
      ]);
      
      // Refresh the tree view and decorations
      this.treeDataProvider.refresh();
      this.decorationProvider.updateDecorations();
    } else {
      vscode.window.showErrorMessage('Failed to delete collection');
    }
  }
} 