export const useAuth = jest.fn(() => ({
  userId: 'test-user-id',
  isSignedIn: true,
  isLoaded: true,
  signOut: jest.fn(),
}));

export const useUser = jest.fn(() => ({
  user: {
    id: 'test-user-id',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    firstName: 'Test',
    lastName: 'User',
  },
  isLoaded: true,
  isSignedIn: true,
}));

export const useClerk = jest.fn(() => ({
  signOut: jest.fn(),
  openSignIn: jest.fn(),
  openSignUp: jest.fn(),
}));

export const SignInButton = ({ children }) => children;
export const SignOutButton = ({ children }) => children;
export const UserButton = () => null;
export const ClerkProvider = ({ children }) => children;
