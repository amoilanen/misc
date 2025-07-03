import { Collection } from '../../models/Collection';

describe('Collection', () => {
  const mockName = 'Test Collection';

  describe('constructor', () => {
    it('should create a collection with required properties', () => {
      const collection = new Collection(mockName);

      expect(collection.name).toBe(mockName);
      expect(collection.id).toBeDefined();
      expect(collection.createdAt).toBeInstanceOf(Date);
      expect(collection.workspaceId).toBeUndefined();
    });

    it('should create a collection with workspace ID', () => {
      const workspaceId = 'file:///test/workspace';
      const collection = new Collection(mockName, workspaceId);

      expect(collection.name).toBe(mockName);
      expect(collection.id).toBeDefined();
      expect(collection.createdAt).toBeInstanceOf(Date);
      expect(collection.workspaceId).toBe(workspaceId);
    });
  });

  describe('toJSON', () => {
    it('should serialize collection to JSON', () => {
      const collection = new Collection(mockName);

      const json = collection.toJSON();

      expect(json).toEqual({
        id: collection.id,
        name: mockName,
        createdAt: collection.createdAt.toISOString(),
        workspaceId: undefined,
      });
    });

    it('should serialize collection with workspace ID to JSON', () => {
      const workspaceId = 'file:///test/workspace';
      const collection = new Collection(mockName, workspaceId);

      const json = collection.toJSON();

      expect(json).toEqual({
        id: collection.id,
        name: mockName,
        createdAt: collection.createdAt.toISOString(),
        workspaceId: workspaceId,
      });
    });
  });

  describe('fromJSON', () => {
    it('should deserialize collection from JSON', () => {
      const createdAt = new Date();
      const json = {
        id: 'test-id',
        name: mockName,
        createdAt: createdAt.toISOString(),
      };

      const collection = Collection.fromJSON(json);

      expect(collection.id).toBe(json.id);
      expect(collection.name).toBe(mockName);
      expect(collection.createdAt).toEqual(createdAt);
      expect(collection.workspaceId).toBeUndefined();
    });

    it('should deserialize collection with workspace ID from JSON', () => {
      const createdAt = new Date();
      const workspaceId = 'file:///test/workspace';
      const json = {
        id: 'test-id',
        name: mockName,
        createdAt: createdAt.toISOString(),
        workspaceId: workspaceId,
      };

      const collection = Collection.fromJSON(json);

      expect(collection.id).toBe(json.id);
      expect(collection.name).toBe(mockName);
      expect(collection.createdAt).toEqual(createdAt);
      expect(collection.workspaceId).toBe(workspaceId);
    });
  });
}); 