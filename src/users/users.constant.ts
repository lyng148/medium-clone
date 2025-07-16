export const USER_VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 6,
    MESSAGE: 'Password must be at least 6 characters long',
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    MIN_MESSAGE: 'Username must be at least 3 characters long',
    MAX_MESSAGE: 'Username cannot exceed 20 characters',
  },
  BIO: {
    MAX_LENGTH: 500,
    MAX_MESSAGE: 'Bio cannot exceed 500 characters',
  },
  EMAIL: {
    MESSAGE: 'Please provide a valid email address',
  },
  IMAGE: {
    MESSAGE: 'Image must be a valid URL',
  },
};
