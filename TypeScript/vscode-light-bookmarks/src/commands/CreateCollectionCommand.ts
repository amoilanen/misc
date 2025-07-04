import * as vscode from 'vscode';
import { CollectionManager } from '../services/CollectionManager';
import { StorageService } from '../services/StorageService';
import { BookmarkTreeDataProvider } from '../providers/BookmarkTreeDataProvider';

export class CreateCollectionCommand {
  constructor(
    private collectionManager: CollectionManager,
    private storageService: StorageService,
    private treeDataProvider: BookmarkTreeDataProvider
  ) {}

  public async execute(): Promise<void> {
    // Get collection name from user using QuickPick for better view integration
    const collectionName = await this.getCollectionNameFromUser();
    if (!collectionName) {
      return; // User cancelled
    }

    // Create the collection
    const collection = this.collectionManager.createCollection(
      collectionName.trim()
    );

    if (collection) {
      vscode.window.showInformationMessage(`Collection "${collectionName}" created successfully`);
      
      // Save to storage
      await this.storageService.saveCollections(this.collectionManager.getAllCollections());
      
      // Refresh only the root level to show the new collection
      this.treeDataProvider.refreshRoot();
    } else {
      vscode.window.showErrorMessage('Failed to create collection');
    }
  }

  private async getCollectionNameFromUser(): Promise<string | undefined> {
    // Use QuickPick with custom input for better view integration
    const quickPick = vscode.window.createQuickPick();
    quickPick.title = 'Create Collection';
    quickPick.placeholder = 'Enter collection name';
    quickPick.canSelectMany = false;
    quickPick.ignoreFocusOut = true;

    return new Promise((resolve) => {
      quickPick.onDidAccept(() => {
        const value = quickPick.value.trim();
        if (!value || value.length === 0) {
          vscode.window.showErrorMessage('Collection name cannot be empty');
          return;
        }
        if (this.collectionManager.hasCollectionByName(value)) {
          vscode.window.showErrorMessage('A collection with this name already exists');
          return;
        }
        quickPick.hide();
        resolve(value);
      });

      quickPick.onDidHide(() => {
        resolve(undefined);
      });

      quickPick.show();
    });
  }
} 