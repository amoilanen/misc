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
      expect(collection.isVisible).toBe(true);
    });

    it('should create a collection with custom visibility', () => {
      const collection = new Collection(mockName, mockColor, false);

      expect(collection.isVisible).toBe(false);
    });
  });

  describe('toggleVisibility', () => {
    it('should toggle visibility from true to false', () => {
      const collection = new Collection(mockName, mockColor, true);
      
      collection.toggleVisibility();
      
      expect(collection.isVisible).toBe(false);
    });

    it('should toggle visibility from false to true', () => {
      const collection = new Collection(mockName, mockColor, false);
      
      collection.toggleVisibility();
      
      expect(collection.isVisible).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('should serialize collection to JSON', () => {
      const collection = new Collection(mockName, mockColor, false);

      const json = collection.toJSON();

      expect(json).toEqual({
        id: collection.id,
        name: mockName,
        color: mockColor,
        isVisible: false,
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
        isVisible: false,
        createdAt: createdAt.toISOString(),
      };

      const collection = Collection.fromJSON(json);

      expect(collection.id).toBe(json.id);
      expect(collection.name).toBe(mockName);
      expect(collection.color).toBe(mockColor);
      expect(collection.isVisible).toBe(false);
      expect(collection.createdAt).toEqual(createdAt);
    });
  });
}); 