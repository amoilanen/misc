import * as vscode from 'vscode';
import { BookmarkManager } from '../services/BookmarkManager';
import { CollectionManager } from '../services/CollectionManager';

export class BookmarkDecorationProvider {
  private gutterDecorationType!: vscode.TextEditorDecorationType;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private bookmarkManager: BookmarkManager,
    private collectionManager: CollectionManager
  ) {
    this.initializeDecorations();
  }

  private initializeDecorations(): void {
    // Get extension path for the bookmark icons
    const extension = vscode.extensions.getExtension('light-bookmarks.vscode-light-bookmarks');
    const filledIconPath = extension ? vscode.Uri.joinPath(extension.extensionUri, 'resources', 'bookmark-icon-filled.svg') : undefined;
    
    // Create gutter decoration type for bookmark icons (use filled icon for editor)
    this.gutterDecorationType = vscode.window.createTextEditorDecorationType({
      gutterIconPath: filledIconPath,
      gutterIconSize: 'contain'
    });

    this.disposables.push(this.gutterDecorationType);
  }

  public updateDecorations(editor?: vscode.TextEditor): void {
    if (!editor) {
      // Update all visible editors
      vscode.window.visibleTextEditors.forEach(editor => {
        this.updateEditorDecorations(editor);
      });
    } else {
      this.updateEditorDecorations(editor);
    }
  }

  private updateEditorDecorations(editor: vscode.TextEditor): void {
    const uri = editor.document.uri.toString();
    const bookmarks = this.bookmarkManager.getBookmarksByUri(uri);
    
    if (bookmarks.length === 0) {
      editor.setDecorations(this.gutterDecorationType, []);
      return;
    }

    const ranges: vscode.Range[] = [];
    
    bookmarks.forEach(bookmark => {
      const line = bookmark.line - 1; // Convert to 0-based index
      if (line >= 0 && line < editor.document.lineCount) {
        const range = new vscode.Range(line, 0, line, 0);
        ranges.push(range);
      }
    });

    editor.setDecorations(this.gutterDecorationType, ranges);
  }

  public dispose(): void {
    this.disposables.forEach(disposable => disposable.dispose());
  }
}

 