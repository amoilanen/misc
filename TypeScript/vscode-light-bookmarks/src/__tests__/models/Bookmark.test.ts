import { Bookmark } from '../../models/Bookmark';

describe('Bookmark', () => {
  const mockUri = 'file:///test/file.ts';
  const mockLine = 10;

  describe('constructor', () => {
    it('should create a bookmark with required properties', () => {
      const bookmark = new Bookmark(mockUri, mockLine);

      expect(bookmark.uri).toBe(mockUri);
      expect(bookmark.line).toBe(mockLine);
      expect(bookmark.id).toBeDefined();
      expect(bookmark.createdAt).toBeInstanceOf(Date);
      expect(bookmark.collectionId).toBeUndefined();
      expect(bookmark.description).toBe('');
    });

    it('should create a bookmark with optional collection', () => {
      const collectionId = 'test-collection';
      const bookmark = new Bookmark(mockUri, mockLine, collectionId);

      expect(bookmark.collectionId).toBe(collectionId);
    });

    it('should create a bookmark with optional description', () => {
      const description = 'Test description';
      const bookmark = new Bookmark(mockUri, mockLine, undefined, description);

      expect(bookmark.description).toBe(description);
    });

    it('should create a bookmark with collection and description', () => {
      const collectionId = 'test-collection';
      const description = 'Test description';
      const bookmark = new Bookmark(mockUri, mockLine, collectionId, description);

      expect(bookmark.collectionId).toBe(collectionId);
      expect(bookmark.description).toBe(description);
    });
  });

  describe('equals', () => {
    it('should return true for bookmarks with same uri and line', () => {
      const bookmark1 = new Bookmark(mockUri, mockLine);
      const bookmark2 = new Bookmark(mockUri, mockLine);

      expect(bookmark1.equals(bookmark2)).toBe(true);
    });

    it('should return false for bookmarks with different uri', () => {
      const bookmark1 = new Bookmark(mockUri, mockLine);
      const bookmark2 = new Bookmark('file:///different/file.ts', mockLine);

      expect(bookmark1.equals(bookmark2)).toBe(false);
    });

    it('should return false for bookmarks with different line', () => {
      const bookmark1 = new Bookmark(mockUri, mockLine);
      const bookmark2 = new Bookmark(mockUri, 20);

      expect(bookmark1.equals(bookmark2)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should serialize bookmark to JSON', () => {
      const collectionId = 'test-collection';
      const bookmark = new Bookmark(mockUri, mockLine, collectionId);

      const json = bookmark.toJSON();

      expect(json).toEqual({
        id: bookmark.id,
        uri: mockUri,
        line: mockLine,
        collectionId,
        description: '',
        createdAt: bookmark.createdAt.toISOString(),
      });
    });

    it('should serialize bookmark with description to JSON', () => {
      const collectionId = 'test-collection';
      const description = 'Test description';
      const bookmark = new Bookmark(mockUri, mockLine, collectionId, description);

      const json = bookmark.toJSON();

      expect(json).toEqual({
        id: bookmark.id,
        uri: mockUri,
        line: mockLine,
        collectionId,
        description,
        createdAt: bookmark.createdAt.toISOString(),
      });
    });
  });

  describe('fromJSON', () => {
    it('should deserialize bookmark from JSON', () => {
      const collectionId = 'test-collection';
      const createdAt = new Date();
      const json = {
        id: 'test-id',
        uri: mockUri,
        line: mockLine,
        collectionId,
        description: 'Test description',
        createdAt: createdAt.toISOString(),
      };

      const bookmark = Bookmark.fromJSON(json);

      expect(bookmark.id).toBe(json.id);
      expect(bookmark.uri).toBe(mockUri);
      expect(bookmark.line).toBe(mockLine);
      expect(bookmark.collectionId).toBe(collectionId);
      expect(bookmark.description).toBe('Test description');
      expect(bookmark.createdAt).toEqual(createdAt);
    });

    it('should handle bookmark without collection', () => {
      const json = {
        id: 'test-id',
        uri: mockUri,
        line: mockLine,
        description: 'Test description',
        createdAt: new Date().toISOString(),
      };

      const bookmark = Bookmark.fromJSON(json);

      expect(bookmark.collectionId).toBeUndefined();
      expect(bookmark.description).toBe('Test description');
    });

    it('should handle bookmark without description', () => {
      const json = {
        id: 'test-id',
        uri: mockUri,
        line: mockLine,
        createdAt: new Date().toISOString(),
      };

      const bookmark = Bookmark.fromJSON(json);

      expect(bookmark.description).toBe('');
    });
  });
}); 