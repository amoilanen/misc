import { StorageService } from '../../services/StorageService';
import { Bookmark } from '../../models/Bookmark';
import { Collection } from '../../models/Collection';

describe('StorageService', () => {
  let storageService: StorageService;
  let mockGlobalState: {
    get: jest.Mock;
    update: jest.Mock;
    keys: jest.Mock;
  };

  beforeEach(() => {
    mockGlobalState = {
      get: jest.fn(),
      update: jest.fn(),
      keys: jest.fn(),
    };
    storageService = new StorageService(mockGlobalState);
  });

  describe('saveBookmarks', () => {
    it('should save bookmarks to storage', async () => {
      const bookmarks = [
        new Bookmark('file:///test1.ts', 10),
        new Bookmark('file:///test2.ts', 20, 'collection-1'),
      ];

      await storageService.saveBookmarks(bookmarks);

      expect(mockGlobalState.update).toHaveBeenCalledWith('bookmarks', [
        bookmarks[0].toJSON(),
        bookmarks[1].toJSON(),
      ]);
    });

    it('should handle empty bookmarks array', async () => {
      await storageService.saveBookmarks([]);

      expect(mockGlobalState.update).toHaveBeenCalledWith('bookmarks', []);
    });
  });

  describe('loadBookmarks', () => {
    it('should load bookmarks from storage', async () => {
      const bookmarkData = [
        {
          id: 'bookmark-1',
          uri: 'file:///test1.ts',
          line: 10,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'bookmark-2',
          uri: 'file:///test2.ts',
          line: 20,
          collectionId: 'collection-1',
          createdAt: new Date().toISOString(),
        },
      ];

      mockGlobalState.get.mockReturnValue(bookmarkData);

      const bookmarks = await storageService.loadBookmarks();

      expect(mockGlobalState.get).toHaveBeenCalledWith('bookmarks', []);
      expect(bookmarks).toHaveLength(2);
      expect(bookmarks[0]).toBeInstanceOf(Bookmark);
      expect(bookmarks[1]).toBeInstanceOf(Bookmark);
    });

    it('should return empty array when no bookmarks stored', async () => {
      mockGlobalState.get.mockReturnValue([]);

      const bookmarks = await storageService.loadBookmarks();

      expect(bookmarks).toHaveLength(0);
    });
  });

  describe('saveCollections', () => {
    it('should save collections to storage', async () => {
      const collections = [
        new Collection('Test 1', '#ff0000'),
        new Collection('Test 2', '#00ff00', false),
      ];

      await storageService.saveCollections(collections);

      expect(mockGlobalState.update).toHaveBeenCalledWith('collections', [
        collections[0].toJSON(),
        collections[1].toJSON(),
      ]);
    });
  });

  describe('loadCollections', () => {
    it('should load collections from storage', async () => {
      const collectionData = [
        {
          id: 'collection-1',
          name: 'Test 1',
          color: '#ff0000',
          isVisible: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'collection-2',
          name: 'Test 2',
          color: '#00ff00',
          isVisible: false,
          createdAt: new Date().toISOString(),
        },
      ];

      mockGlobalState.get.mockReturnValue(collectionData);

      const collections = await storageService.loadCollections();

      expect(mockGlobalState.get).toHaveBeenCalledWith('collections', []);
      expect(collections).toHaveLength(2);
      expect(collections[0]).toBeInstanceOf(Collection);
      expect(collections[1]).toBeInstanceOf(Collection);
    });
  });

  describe('clearAllData', () => {
    it('should clear all stored data', async () => {
      await storageService.clearAllData();

      expect(mockGlobalState.update).toHaveBeenCalledWith('bookmarks', []);
      expect(mockGlobalState.update).toHaveBeenCalledWith('collections', []);
    });
  });
}); 