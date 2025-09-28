// Mock MongoDB module for Jest tests
module.exports = {
  MongoClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    db: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue({
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
          limit: jest.fn().mockReturnThis(),
        }),
        findOne: jest.fn().mockResolvedValue(null),
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      }),
    }),
    close: jest.fn(),
  })),
  ObjectId: Object.assign(
    jest.fn().mockImplementation((id) => ({
      toString: () => id || 'mock-object-id',
      valueOf: () => id || 'mock-object-id',
    })),
    {
      isValid: jest.fn().mockImplementation((id) => {
        // Mock ObjectId.isValid to return true for valid ObjectId format
        return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
      }),
    }
  ),
};
