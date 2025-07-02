import { CollectionManager } from '../../services/CollectionManager';
import { Collection } from '../../models/Collection';

describe('CollectionManager', () => {
  let collectionManager: CollectionManager;

  beforeEach(() => {
    collectionManager = new CollectionManager();
  });

  describe('createCollection', () => {
    it('should create a collection successfully', () => {
      const collection = collectionManager.createCollection('Test Collection', '#ff0000');

      expect(collection).toBeInstanceOf(Collection);
      expect(collection).not.toBeNull();
      if (collection) {
        expect(collection.name).toBe('Test Collection');
        expect(collection.color).toBe('#ff0000');
      }
      expect(collectionManager.getAllCollections()).toHaveLength(1);
    });

    it('should not create collection with duplicate name', () => {
      collectionManager.createCollection('Test Collection', '#ff0000');
      const result = collectionManager.createCollection('Test Collection', '#00ff00');

      expect(result).toBeNull();
      expect(collectionManager.getAllCollections()).toHaveLength(1);
    });
  });

  describe('deleteCollection', () => {
    it('should delete existing collection', () => {
      const collection = collectionManager.createCollection('Test Collection', '#ff0000');
      expect(collection).not.toBeNull();
      if (!collection) return;
      
      const result = collectionManager.deleteCollection(collection.id);

      expect(result).toBe(true);
      expect(collectionManager.getAllCollections()).toHaveLength(0);
    });

    it('should return false for non-existent collection', () => {
      const result = collectionManager.deleteCollection('non-existent-id');

      expect(result).toBe(false);
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

  describe('getVisibleCollections', () => {
    it('should return only visible collections', () => {
      const visibleCollection = collectionManager.createCollection('Visible', '#ff0000');
      const hiddenCollection = collectionManager.createCollection('Hidden', '#00ff00');
      expect(visibleCollection).not.toBeNull();
      expect(hiddenCollection).not.toBeNull();
      if (!visibleCollection || !hiddenCollection) return;
      
      hiddenCollection.toggleVisibility();

      const visibleCollections = collectionManager.getVisibleCollections();

      expect(visibleCollections).toHaveLength(1);
      expect(visibleCollections[0]).toBe(visibleCollection);
    });
  });

  describe('clearAllCollections', () => {
    it('should remove all collections', () => {
      collectionManager.createCollection('Test 1', '#ff0000');
      collectionManager.createCollection('Test 2', '#00ff00');

      collectionManager.clearAllCollections();

      expect(collectionManager.getAllCollections()).toHaveLength(0);
    });
  });
}); 