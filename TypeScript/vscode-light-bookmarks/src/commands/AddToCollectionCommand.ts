import * as vscode from 'vscode';
import { BookmarkManager } from '../services/BookmarkManager';
import { CollectionManager } from '../services/CollectionManager';
import { StorageService } from '../services/StorageService';
import { BookmarkTreeDataProvider } from '../providers/BookmarkTreeDataProvider';
import { BookmarkDecorationProvider } from '../providers/BookmarkDecorationProvider';

export class AddToCollectionCommand {
  constructor(
    private bookmarkManager: BookmarkManager,
    private collectionManager: CollectionManager,
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
    const line = editor.selection.active.line + 1;

    // Check if there's already a bookmark at this location
    const existingBookmark = this.bookmarkManager.getBookmark(uri, line);
    if (!existingBookmark) {
      vscode.window.showInformationMessage('No bookmark found at current line. Please add a bookmark first.');
      return;
    }

    // Get available collections for current workspace
    const currentWorkspaceId = vscode.workspace.workspaceFolders?.[0]?.uri.toString();
    const collections = this.collectionManager.getCollectionsForWorkspace(currentWorkspaceId);
    
    // Add "Ungrouped" option to the list
    const collectionOptions = [
      { label: 'Ungrouped', id: 'ungrouped' },
      ...collections.map(c => ({ label: c.name, id: c.id }))
    ];

    if (collectionOptions.length === 1) {
      vscode.window.showInformationMessage('No collections available. Please create a collection first.');
      return;
    }

    // Show collection picker
    const selectedOption = await vscode.window.showQuickPick(collectionOptions, {
      placeHolder: 'Select a collection to add the bookmark to'
    });

    if (!selectedOption) {
      return; // User cancelled
    }

    // Remove the existing bookmark and add it to the collection or ungroup it
    this.bookmarkManager.removeBookmark(uri, line);
    let newBookmark;
    
    if (selectedOption.id === 'ungrouped') {
      newBookmark = this.bookmarkManager.addBookmark(uri, line);
    } else {
      newBookmark = this.bookmarkManager.addBookmark(uri, line, selectedOption.id);
    }

    if (newBookmark) {
      const message = selectedOption.id === 'ungrouped' 
        ? 'Bookmark moved to ungrouped'
        : `Bookmark added to collection "${selectedOption.label}"`;
      vscode.window.showInformationMessage(message);
      
      // Save to storage
      await this.storageService.saveBookmarks(this.bookmarkManager.getAllBookmarks());
      
      // Refresh the tree view and decorations
      this.treeDataProvider.refresh();
      this.decorationProvider.updateDecorations(editor);
    }
  }
} 