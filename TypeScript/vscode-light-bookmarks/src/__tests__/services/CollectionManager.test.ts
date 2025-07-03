import { CollectionManager } from '../../services/CollectionManager';

describe('CollectionManager', () => {
  let collectionManager: CollectionManager;

  beforeEach(() => {
    collectionManager = new CollectionManager();
  });

  describe('createCollection', () => {
    it('should create a new collection', () => {
      const collection = collectionManager.createCollection('Test Collection', '#ff0000');

      expect(collection).not.toBeNull();
      expect(collection?.name).toBe('Test Collection');
      expect(collection?.color).toBe('#ff0000');
    });

    it('should return null if collection with same name already exists', () => {
      collectionManager.createCollection('Test Collection', '#ff0000');
      const duplicate = collectionManager.createCollection('Test Collection', '#00ff00');

      expect(duplicate).toBeNull();
    });
  });

  describe('deleteCollection', () => {
    it('should delete collection by id', () => {
      const collection = collectionManager.createCollection('Test Collection', '#ff0000');
      expect(collection).not.toBeNull();
      if (!collection) return;

      const deleted = collectionManager.deleteCollection(collection.id);

      expect(deleted).toBe(true);
      expect(collectionManager.getCollection(collection.id)).toBeUndefined();
    });

    it('should return false for non-existent collection', () => {
      const deleted = collectionManager.deleteCollection('non-existent-id');

      expect(deleted).toBe(false);
    });
  });

  describe('getCollection', () => {
    it('should return collection by id', () => {
      const collection = collectionManager.createCollection('Test Collection', '#ff0000');
      expect(collection).not.toBeNull();
      if (!collection) return;
      
      const found = collectionManager.getCollection(collection.id);

      expect(found).toBe(collection);
    });

    it('should return undefined for non-existent collection', () => {
      const found = collectionManager.getCollection('non-existent-id');

      expect(found).toBeUndefined();
    });
  });

  describe('getCollectionByName', () => {
    it('should return collection by name', () => {
      const collection = collectionManager.createCollection('Test Collection', '#ff0000');
      expect(collection).not.toBeNull();
      if (!collection) return;
      
      const found = collectionManager.getCollectionByName('Test Collection');

      expect(found).toBe(collection);
    });

    it('should return undefined for non-existent collection name', () => {
      const found = collectionManager.getCollectionByName('Non-existent Collection');

      expect(found).toBeUndefined();
    });
  });

  describe('getAllCollections', () => {
    it('should return all collections', () => {
      const collection1 = collectionManager.createCollection('Collection 1', '#ff0000');
      const collection2 = collectionManager.createCollection('Collection 2', '#00ff00');
      expect(collection1).not.toBeNull();
      expect(collection2).not.toBeNull();
      if (!collection1 || !collection2) return;

      const allCollections = collectionManager.getAllCollections();

      expect(allCollections).toHaveLength(2);
      expect(allCollections).toContain(collection1);
      expect(allCollections).toContain(collection2);
    });

    it('should return empty array when no collections exist', () => {
      const allCollections = collectionManager.getAllCollections();

      expect(allCollections).toHaveLength(0);
    });
  });

  describe('clearAllCollections', () => {
    it('should remove all collections', () => {
      collectionManager.createCollection('Collection 1', '#ff0000');
      collectionManager.createCollection('Collection 2', '#00ff00');

      collectionManager.clearAllCollections();

      expect(collectionManager.getAllCollections()).toHaveLength(0);
    });
  });

  describe('hasCollection', () => {
    it('should return true for existing collection', () => {
      const collection = collectionManager.createCollection('Test Collection', '#ff0000');
      expect(collection).not.toBeNull();
      if (!collection) return;

      const hasCollection = collectionManager.hasCollection(collection.id);

      expect(hasCollection).toBe(true);
    });

    it('should return false for non-existent collection', () => {
      const hasCollection = collectionManager.hasCollection('non-existent-id');

      expect(hasCollection).toBe(false);
    });
  });

  describe('hasCollectionByName', () => {
    it('should return true for existing collection name', () => {
      collectionManager.createCollection('Test Collection', '#ff0000');

      const hasCollection = collectionManager.hasCollectionByName('Test Collection');

      expect(hasCollection).toBe(true);
    });

    it('should return false for non-existent collection name', () => {
      const hasCollection = collectionManager.hasCollectionByName('Non-existent Collection');

      expect(hasCollection).toBe(false);
    });
  });
}); 