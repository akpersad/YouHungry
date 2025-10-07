export const put = jest.fn().mockResolvedValue({
  url: 'https://blob.vercel-storage.com/test-file.jpg',
  downloadUrl: 'https://blob.vercel-storage.com/test-file.jpg',
  pathname: 'test-file.jpg',
  contentType: 'image/jpeg',
  contentDisposition: 'inline; filename="test-file.jpg"',
  size: 1024,
  uploadedAt: new Date('2023-01-01'),
});

export const del = jest.fn().mockResolvedValue(undefined);

export const head = jest.fn().mockResolvedValue({
  url: 'https://blob.vercel-storage.com/test-file.jpg',
  downloadUrl: 'https://blob.vercel-storage.com/test-file.jpg',
  pathname: 'test-file.jpg',
  contentType: 'image/jpeg',
  contentDisposition: 'inline; filename="test-file.jpg"',
  size: 1024,
  uploadedAt: new Date('2023-01-01'),
});

export const list = jest.fn().mockResolvedValue({
  blobs: [],
  hasMore: false,
  cursor: null,
});

export const copy = jest.fn().mockResolvedValue({
  url: 'https://blob.vercel-storage.com/copied-file.jpg',
  downloadUrl: 'https://blob.vercel-storage.com/copied-file.jpg',
  pathname: 'copied-file.jpg',
  contentType: 'image/jpeg',
  contentDisposition: 'inline; filename="copied-file.jpg"',
  size: 1024,
  uploadedAt: new Date('2023-01-01'),
});
