import * as vscode from 'vscode';
import { BookmarkManager } from '../services/BookmarkManager';
import { CollectionManager } from '../services/CollectionManager';
import { StorageService } from '../services/StorageService';
import { BookmarkTreeDataProvider } from '../providers/BookmarkTreeDataProvider';
import { BookmarkDecorationProvider } from '../providers/BookmarkDecorationProvider';

export class RemoveFromCollectionCommand {
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
      vscode.window.showInformationMessage('No bookmark found at current line.');
      return;
    }

    // Check if the bookmark is in a collection
    if (!existingBookmark.collectionId) {
      vscode.window.showInformationMessage('This bookmark is not in any collection.');
      return;
    }

    const collection = this.collectionManager.getCollection(existingBookmark.collectionId);
    if (!collection) {
      vscode.window.showErrorMessage('Collection not found');
      return;
    }

    // Prevent removal from the "Ungrouped" collection
    if (collection.id === 'ungrouped-bookmarks') {
      vscode.window.showInformationMessage('Bookmarks cannot be removed from the "Ungrouped" collection. Use "Add to Collection" to move them to another collection.');
      return;
    }

    // Remove the bookmark and add it back without collection
    this.bookmarkManager.removeBookmark(uri, line);
    const newBookmark = this.bookmarkManager.addBookmark(uri, line);

    if (newBookmark) {
      vscode.window.showInformationMessage(`Bookmark removed from collection "${collection.name}"`);
      
      // Save to storage
      await this.storageService.saveBookmarks(this.bookmarkManager.getAllBookmarks());
      
      // Refresh the tree view and decorations
      this.treeDataProvider.refresh();
      this.decorationProvider.updateDecorations();
    }
  }
} 