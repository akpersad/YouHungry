const mockClerkClient = {
  users: {
    getUser: jest.fn(),
  },
  verifyToken: jest.fn(),
};

module.exports = {
  createClerkClient: jest.fn(() => mockClerkClient),
  verifyToken: jest.fn(),
  createUser: jest.fn(),
};
