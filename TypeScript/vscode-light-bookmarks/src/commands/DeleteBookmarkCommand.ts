import * as vscode from 'vscode';
import { BookmarkManager } from '../services/BookmarkManager';
import { StorageService } from '../services/StorageService';
import { BookmarkTreeDataProvider } from '../providers/BookmarkTreeDataProvider';
import { BookmarkDecorationProvider } from '../providers/BookmarkDecorationProvider';

export class DeleteBookmarkCommand {
  constructor(
    private bookmarkManager: BookmarkManager,
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

    const bookmarkFileName = uri.split('/').pop();
    // Show confirmation dialog
    const result = await vscode.window.showWarningMessage(
      `Are you sure you want to delete the bookmark at ${bookmarkFileName}:${line}?`,
      { modal: true },
      'Delete'
    );

    if (result !== 'Delete') {
      return; // User cancelled
    }

    // Remove the bookmark
    const removed = this.bookmarkManager.removeBookmark(uri, line);
    if (removed) {
      vscode.window.showInformationMessage(`Bookmark deleted from line ${line}`);
      
      // Save to storage
      await this.storageService.saveBookmarks(this.bookmarkManager.getAllBookmarks());
      
      // Refresh the tree view and decorations
      this.treeDataProvider.refresh();
      this.decorationProvider.updateDecorations();
    } else {
      vscode.window.showErrorMessage('Failed to delete bookmark');
    }
  }
} 