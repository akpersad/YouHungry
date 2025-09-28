// Mock BSON module for Jest tests
module.exports = {
  ObjectId: Object.assign(
    jest.fn().mockImplementation((id) => ({
      toString: () => id || 'mock-object-id',
      valueOf: () => id || 'mock-object-id',
    })),
    {
      isValid: jest.fn().mockImplementation((id) => {
        // Mock ObjectId.isValid to return true for valid-looking IDs
        return typeof id === 'string' && id.length > 0;
      }),
    }
  ),
  Binary: jest.fn(),
  Code: jest.fn(),
  DBRef: jest.fn(),
  Decimal128: jest.fn(),
  Double: jest.fn(),
  Int32: jest.fn(),
  Long: jest.fn(),
  MaxKey: jest.fn(),
  MinKey: jest.fn(),
  Timestamp: jest.fn(),
  UUID: jest.fn(),
  calculateObjectSize: jest.fn(),
  deserialize: jest.fn(),
  serialize: jest.fn(),
  onDemand: jest.fn(),
};
