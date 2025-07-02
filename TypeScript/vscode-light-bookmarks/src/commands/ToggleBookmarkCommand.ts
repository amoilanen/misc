import * as vscode from 'vscode';
import { BookmarkManager } from '../services/BookmarkManager';
import { StorageService } from '../services/StorageService';
import { BookmarkTreeDataProvider } from '../providers/BookmarkTreeDataProvider';
import { BookmarkDecorationProvider } from '../providers/BookmarkDecorationProvider';

export class ToggleBookmarkCommand {
  constructor(
    private bookmarkManager: BookmarkManager,
    private storageService: StorageService,
    private treeDataProvider: BookmarkTreeDataProvider,
    private decorationProvider: BookmarkDecorationProvider
  ) {}

  public async execute(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No active editor found');
      return;
    }

    const uri = editor.document.uri.toString();
    const line = editor.selection.active.line + 1; // Convert to 1-based line number

    const bookmark = this.bookmarkManager.toggleBookmark(uri, line);

    if (bookmark) {
      // Bookmark was added
      vscode.window.showInformationMessage(`Bookmark added at line ${line}`);
    } else {
      // Bookmark was removed
      vscode.window.showInformationMessage(`Bookmark removed from line ${line}`);
    }

    // Save to storage
    await this.storageService.saveBookmarks(this.bookmarkManager.getAllBookmarks());

    // Refresh the tree view and decorations
    this.treeDataProvider.refresh();
    this.decorationProvider.updateDecorations(editor);
  }
} 