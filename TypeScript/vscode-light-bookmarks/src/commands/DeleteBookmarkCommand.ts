import * as vscode from 'vscode';
import { BookmarkManager } from '../services/BookmarkManager';
import { CollectionManager } from '../services/CollectionManager';
import { StorageService } from '../services/StorageService';
import { BookmarkTreeDataProvider } from '../providers/BookmarkTreeDataProvider';
import { BookmarkDecorationProvider } from '../providers/BookmarkDecorationProvider';

export class DeleteBookmarkCommand {
  constructor(
    private bookmarkManager: BookmarkManager,
    private collectionManager: CollectionManager,
    private storageService: StorageService,
    private treeDataProvider: BookmarkTreeDataProvider,
    private decorationProvider: BookmarkDecorationProvider
  ) {}

  public async execute(bookmarkUri?: string, bookmarkLine?: number): Promise<void> {
    let uri: string;
    let line: number;

    if (bookmarkUri && bookmarkLine !== undefined) {
      // Called with specific bookmark parameters
      uri = bookmarkUri;
      line = bookmarkLine;
    } else {
      // Called from editor context
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage('No active editor found');
        return;
      }
      uri = editor.document.uri.toString();
      line = editor.selection.active.line + 1;
    }

    // Check if there's a bookmark at this location
    const existingBookmark = this.bookmarkManager.getBookmark(uri, line);
    if (!existingBookmark) {
      vscode.window.showInformationMessage('No bookmark found at the specified location.');
      return;
    }

    // Remove the bookmark
    const removed = this.bookmarkManager.removeBookmark(uri, line);
    if (removed) {
      vscode.window.showInformationMessage(`Bookmark deleted from line ${line}`);
      
      // Save to storage
      await this.storageService.saveBookmarks(this.bookmarkManager.getAllBookmarks());
      
      // Refresh only the relevant parts of the tree
      if (existingBookmark.collectionId) {
        // Bookmark was removed from a collection, refresh that collection
        const collection = this.collectionManager.getCollection(existingBookmark.collectionId);
        if (collection) {
          this.treeDataProvider.refreshCollection(collection);
        }
      } else {
        // Bookmark was removed from ungrouped, refresh ungrouped section
        this.treeDataProvider.refreshUngrouped();
      }
      
      // Also refresh root to update counts
      this.treeDataProvider.refreshRoot();
      
      this.decorationProvider.updateDecorations();
    } else {
      vscode.window.showErrorMessage('Failed to delete bookmark');
    }
  }
} 