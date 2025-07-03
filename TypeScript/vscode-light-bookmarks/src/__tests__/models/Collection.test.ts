import { Collection } from '../../models/Collection';

describe('Collection', () => {
  const mockName = 'Test Collection';
  const mockColor = '#ff0000';

  describe('constructor', () => {
    it('should create a collection with required properties', () => {
      const collection = new Collection(mockName, mockColor);

      expect(collection.name).toBe(mockName);
      expect(collection.color).toBe(mockColor);
      expect(collection.id).toBeDefined();
      expect(collection.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('toJSON', () => {
    it('should serialize collection to JSON', () => {
      const collection = new Collection(mockName, mockColor);

      const json = collection.toJSON();

      expect(json).toEqual({
        id: collection.id,
        name: mockName,
        color: mockColor,
        createdAt: collection.createdAt.toISOString(),
      });
    });
  });

  describe('fromJSON', () => {
    it('should deserialize collection from JSON', () => {
      const createdAt = new Date();
      const json = {
        id: 'test-id',
        name: mockName,
        color: mockColor,
        createdAt: createdAt.toISOString(),
      };

      const collection = Collection.fromJSON(json);

      expect(collection.id).toBe(json.id);
      expect(collection.name).toBe(mockName);
      expect(collection.color).toBe(mockColor);
      expect(collection.createdAt).toEqual(createdAt);
    });
  });
}); 