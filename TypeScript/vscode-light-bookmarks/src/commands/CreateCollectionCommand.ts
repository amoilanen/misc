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
    // Get collection name from user
    const collectionName = await vscode.window.showInputBox({
      prompt: 'Enter collection name',
      placeHolder: 'My Collection',
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Collection name cannot be empty';
        }
        if (this.collectionManager.hasCollectionByName(value.trim())) {
          return 'A collection with this name already exists';
        }
        return null;
      }
    });

    if (!collectionName) {
      return; // User cancelled
    }

    // Get collection color from user
    const colors = [
      '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
      '#ff8800', '#8800ff', '#00ff88', '#ff0088', '#880000', '#008800'
    ];

    const colorNames = [
      'Red', 'Green', 'Blue', 'Yellow', 'Magenta', 'Cyan',
      'Orange', 'Purple', 'Teal', 'Pink', 'Dark Red', 'Dark Green'
    ];

    const colorOptions = colors.map((color, index) => ({
      label: `$(circle-filled) ${colorNames[index]}`,
      description: color,
      color: color
    }));

    const selectedColorOption = await vscode.window.showQuickPick(colorOptions, {
      placeHolder: 'Select a color for the collection'
    });

    if (!selectedColorOption) {
      return; // User cancelled
    }

    // Create the collection
    const collection = this.collectionManager.createCollection(
      collectionName.trim(),
      selectedColorOption.color
    );

    if (collection) {
      vscode.window.showInformationMessage(`Collection "${collectionName}" created successfully`);
      
      // Save to storage
      await this.storageService.saveCollections(this.collectionManager.getAllCollections());
      
      // Refresh the tree view
      this.treeDataProvider.refresh();
    } else {
      vscode.window.showErrorMessage('Failed to create collection');
    }
  }
} 