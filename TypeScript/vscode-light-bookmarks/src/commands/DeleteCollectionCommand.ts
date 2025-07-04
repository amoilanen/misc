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
    // Prevent deletion of the "Ungrouped" collection
    if (collectionId === 'ungrouped-bookmarks') {
      vscode.window.showErrorMessage('The "Ungrouped" collection cannot be deleted');
      return;
    }

    const collection = this.collectionManager.getCollection(collectionId);
    if (!collection) {
      vscode.window.showErrorMessage('Collection not found');
      return;
    }

    // Get bookmarks in this collection
    const bookmarksInCollection = this.bookmarkManager.getBookmarksByCollection(collectionId);
    
    // If collection is empty, delete immediately
    if (bookmarksInCollection.length === 0) {
      await this.deleteCollection(collectionId, collection);
      return;
    }

    // If collection has bookmarks, ask for confirmation
    const result = await vscode.window.showWarningMessage(
      'Deleting collection will also delete bookmarks contained in it, proceed?',
      { modal: true },
      'Delete'
    );

    if (result === 'Delete') {
      // Remove all bookmarks in the collection
      bookmarksInCollection.forEach(bookmark => {
        this.bookmarkManager.removeBookmark(bookmark.uri, bookmark.line);
      });
      
      // Delete the collection
      await this.deleteCollection(collectionId, collection);
    }
    // If user cancels, do nothing - collection remains unchanged
  }

  private async deleteCollection(collectionId: string, collection: { id: string; name: string }): Promise<void> {
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