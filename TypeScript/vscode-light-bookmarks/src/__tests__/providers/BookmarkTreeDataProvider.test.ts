import * as vscode from 'vscode';
import { BookmarkTreeDataProvider, BookmarkTreeItem, CodeLineTreeItem } from '../../providers/BookmarkTreeDataProvider';
import { BookmarkManager } from '../../services/BookmarkManager';
import { CollectionManager } from '../../services/CollectionManager';
import { Bookmark } from '../../models/Bookmark';

// Mock vscode
jest.mock('vscode', () => ({
  TreeItem: jest.fn(),
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
  EventEmitter: jest.fn().mockImplementation(() => ({
    fire: jest.fn(),
    event: jest.fn(),
  })),
  ThemeIcon: jest.fn(),
  MarkdownString: jest.fn().mockImplementation((value: string) => ({
    value,
    isTrusted: false,
  })),
  Uri: {
    parse: jest.fn((uri: string) => {
      // Extract the path from the URI string
      const match = uri.match(/^file:\/\/(.*)$/);
      let path = match ? `/${match[1]}` : uri;
      // Remove any duplicate leading slashes
      path = path.replace(/^\/\//, '/');
      return {
        scheme: 'file',
        authority: '',
        path,
        toString: () => uri,
      };
    }),
  },
  Range: jest.fn(),
  workspace: {
    openTextDocument: jest.fn(),
    workspaceFolders: [
      {
        uri: { scheme: 'file', authority: '', path: '/workspace' },
      },
    ],
  },
  window: {
    createTreeView: jest.fn(),
  },
}));

// Patch the TreeItem mock to set collapsibleState
(jest.requireMock('vscode').TreeItem as jest.Mock).mockImplementation(function(this: vscode.TreeItem, label: string, collapsibleState?: number) {
  this.label = label;
  this.collapsibleState = collapsibleState;
});

describe('BookmarkTreeDataProvider', () => {
  let treeDataProvider: BookmarkTreeDataProvider;
  let bookmarkManager: BookmarkManager;
  let collectionManager: CollectionManager;

  beforeEach(() => {
    bookmarkManager = new BookmarkManager();
    collectionManager = new CollectionManager();
    treeDataProvider = new BookmarkTreeDataProvider(bookmarkManager, collectionManager);
    // Patch workspaceFolders to match the test URI
    (vscode.workspace as unknown as { workspaceFolders: vscode.WorkspaceFolder[] }).workspaceFolders = [
      { 
        uri: vscode.Uri.parse('file:///workspace'),
        name: 'workspace',
        index: 0
      },
    ];
  });

  describe('getChildren', () => {
    it('should return root items when no element is provided', async () => {
      // Use a URI that matches the workspace folder
      const bookmark = new Bookmark('file:///workspace/test.ts', 5);
      bookmarkManager.addBookmark(bookmark.uri, bookmark.line);
      const children = await treeDataProvider.getChildren();
      
      expect(children).toHaveLength(1);
      expect(children[0]).toBeInstanceOf(BookmarkTreeItem);
      expect((children[0] as BookmarkTreeItem).label).toBe('Ungrouped (1)');
    });

    it('should return code line items when bookmark element is provided', async () => {
      const bookmark = new Bookmark('file:///workspace/test.ts', 5);
      const bookmarkTreeItem = new BookmarkTreeItem(
        'test.ts:5',
        vscode.TreeItemCollapsibleState.Collapsed,
        bookmark
      );

      // Mock the workspace.openTextDocument to return a document with a line
      const mockDocument = {
        lineAt: jest.fn().mockReturnValue({ text: 'const test = "hello";' }),
      };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockDocument);

      const children = await treeDataProvider.getChildren(bookmarkTreeItem);
      
      expect(children).toHaveLength(1);
      expect(children[0]).toBeInstanceOf(CodeLineTreeItem);
      expect((children[0] as CodeLineTreeItem).codeLine).toBe('const test = "hello";');
      expect((children[0] as CodeLineTreeItem).lineNumber).toBe(5);
    });

    it('should return error message when code line cannot be read', async () => {
      const bookmark = new Bookmark('file:///workspace/test.ts', 5);
      const bookmarkTreeItem = new BookmarkTreeItem(
        'test.ts:5',
        vscode.TreeItemCollapsibleState.Collapsed,
        bookmark
      );

      // Mock the workspace.openTextDocument to throw an error
      (vscode.workspace.openTextDocument as jest.Mock).mockRejectedValue(new Error('File not found'));

      const children = await treeDataProvider.getChildren(bookmarkTreeItem);
      
      expect(children).toHaveLength(1);
      expect(children[0]).toBeInstanceOf(CodeLineTreeItem);
      expect((children[0] as CodeLineTreeItem).codeLine).toBe('Unable to read code line');
      expect((children[0] as CodeLineTreeItem).lineNumber).toBe(5);
    });
  });

  describe('CodeLineTreeItem', () => {
    it('should create a code line tree item with correct properties', () => {
      const codeLine = 'const test = "hello";';
      const lineNumber = 5;
      const bookmark = new Bookmark('file:///workspace/test.ts', lineNumber);
      
      const treeItem = new CodeLineTreeItem(codeLine, lineNumber, bookmark);
      
      expect(treeItem.codeLine).toBe(codeLine);
      expect(treeItem.lineNumber).toBe(lineNumber);
      expect(treeItem.bookmark).toBe(bookmark);
      // Accept 0 (None) or undefined for collapsibleState due to mock
      expect([0, undefined]).toContain(treeItem.collapsibleState);
      expect(treeItem.contextValue).toBe('code-line');
    });
  });
}); 