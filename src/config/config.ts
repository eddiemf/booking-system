export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export function getConfig() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new ConfigError('DATABASE_URL environment variable is required.');
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new ConfigError('JWT_SECRET environment variable is required.');
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    throw new ConfigError('GOOGLE_CLIENT_ID environment variable is required.');
  }

  return {
    database: {
      url: databaseUrl,
    },
    auth: {
      jwtSecret,
      googleClientId,
    },
  };
}
