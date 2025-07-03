import { CollectionManager } from '../../services/CollectionManager';
import { Collection } from '../../models/Collection';

describe('CollectionManager', () => {
  let collectionManager: CollectionManager;

  beforeEach(() => {
    collectionManager = new CollectionManager();
  });

  describe('createCollection', () => {
    it('should create a new collection', () => {
      const collection = collectionManager.createCollection('Test Collection');

      expect(collection).not.toBeNull();
      expect(collection?.name).toBe('Test Collection');
      expect(collection?.workspaceId).toBeUndefined();
    });

    it('should create a collection with workspace ID', () => {
      const workspaceId = 'file:///test/workspace';
      const collection = collectionManager.createCollection('Test Collection', workspaceId);

      expect(collection).not.toBeNull();
      expect(collection?.name).toBe('Test Collection');
      expect(collection?.workspaceId).toBe(workspaceId);
    });

    it('should return null if collection with same name already exists in the same workspace', () => {
      const workspaceId = 'file:///test/workspace';
      collectionManager.createCollection('Test Collection', workspaceId);
      const duplicate = collectionManager.createCollection('Test Collection', workspaceId);

      expect(duplicate).toBeNull();
    });

    it('should allow collections with same name in different workspaces', () => {
      const workspace1 = 'file:///workspace1';
      const workspace2 = 'file:///workspace2';
      
      const collection1 = collectionManager.createCollection('Test Collection', workspace1);
      const collection2 = collectionManager.createCollection('Test Collection', workspace2);

      expect(collection1).not.toBeNull();
      expect(collection2).not.toBeNull();
      expect(collection1?.workspaceId).toBe(workspace1);
      expect(collection2?.workspaceId).toBe(workspace2);
    });
  });

  describe('deleteCollection', () => {
    it('should delete collection by id', () => {
      const collection = collectionManager.createCollection('Test Collection');
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
      const collection = collectionManager.createCollection('Test Collection');
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
      const collection = collectionManager.createCollection('Test Collection');
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
      const collection1 = collectionManager.createCollection('Collection 1');
      const collection2 = collectionManager.createCollection('Collection 2');
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

  describe('getCollectionsForWorkspace', () => {
    it('should return collections for specific workspace', () => {
      const workspace1 = 'file:///workspace1';
      const workspace2 = 'file:///workspace2';
      
      const collection1 = collectionManager.createCollection('Collection 1', workspace1);
      const collection2 = collectionManager.createCollection('Collection 2', workspace1);
      const collection3 = collectionManager.createCollection('Collection 3', workspace2);
      expect(collection1).not.toBeNull();
      expect(collection2).not.toBeNull();
      expect(collection3).not.toBeNull();
      if (!collection1 || !collection2 || !collection3) return;

      const workspace1Collections = collectionManager.getCollectionsForWorkspace(workspace1);
      const workspace2Collections = collectionManager.getCollectionsForWorkspace(workspace2);

      expect(workspace1Collections).toHaveLength(2);
      expect(workspace1Collections).toContain(collection1);
      expect(workspace1Collections).toContain(collection2);
      
      expect(workspace2Collections).toHaveLength(1);
      expect(workspace2Collections).toContain(collection3);
    });

    it('should return collections without workspace ID when workspaceId is undefined', () => {
      const collection1 = collectionManager.createCollection('Collection 1'); // no workspace
      const collection2 = collectionManager.createCollection('Collection 2', 'file:///workspace1');
      expect(collection1).not.toBeNull();
      expect(collection2).not.toBeNull();
      if (!collection1 || !collection2) return;

      const noWorkspaceCollections = collectionManager.getCollectionsForWorkspace(undefined);

      expect(noWorkspaceCollections).toHaveLength(1);
      expect(noWorkspaceCollections).toContain(collection1);
    });

    it('should return empty array when no collections exist for workspace', () => {
      const collections = collectionManager.getCollectionsForWorkspace('file:///nonexistent');

      expect(collections).toHaveLength(0);
    });
  });

  describe('addCollection', () => {
    it('should add a collection directly', () => {
      const collection = new Collection('Test Collection', 'file:///workspace1');

      collectionManager.addCollection(collection);

      expect(collectionManager.getAllCollections()).toHaveLength(1);
      expect(collectionManager.getCollection(collection.id)).toBe(collection);
    });
  });

  describe('clearAllCollections', () => {
    it('should remove all collections', () => {
      collectionManager.createCollection('Collection 1');
      collectionManager.createCollection('Collection 2');

      collectionManager.clearAllCollections();

      expect(collectionManager.getAllCollections()).toHaveLength(0);
    });
  });

  describe('hasCollection', () => {
    it('should return true for existing collection', () => {
      const collection = collectionManager.createCollection('Test Collection');
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
      collectionManager.createCollection('Test Collection');

      const hasCollection = collectionManager.hasCollectionByName('Test Collection');

      expect(hasCollection).toBe(true);
    });

    it('should return false for non-existent collection name', () => {
      const hasCollection = collectionManager.hasCollectionByName('Non-existent Collection');

      expect(hasCollection).toBe(false);
    });
  });
}); 