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

    // Get available collections
    const collections = this.collectionManager.getAllCollections();
    if (collections.length === 0) {
      vscode.window.showInformationMessage('No collections available. Please create a collection first.');
      return;
    }

    // Show collection picker
    const collectionNames = collections.map(c => c.name);
    const selectedCollectionName = await vscode.window.showQuickPick(collectionNames, {
      placeHolder: 'Select a collection to add the bookmark to'
    });

    if (!selectedCollectionName) {
      return; // User cancelled
    }

    const selectedCollection = this.collectionManager.getCollectionByName(selectedCollectionName);
    if (!selectedCollection) {
      vscode.window.showErrorMessage('Selected collection not found');
      return;
    }

    // Remove the existing bookmark and add it to the collection
    this.bookmarkManager.removeBookmark(uri, line);
    const newBookmark = this.bookmarkManager.addBookmark(uri, line, selectedCollection.id);

    if (newBookmark) {
      vscode.window.showInformationMessage(`Bookmark added to collection "${selectedCollectionName}"`);
      
      // Save to storage
      await this.storageService.saveBookmarks(this.bookmarkManager.getAllBookmarks());
      
      // Refresh the tree view and decorations
      this.treeDataProvider.refresh();
      this.decorationProvider.updateDecorations(editor);
    }
  }
} 