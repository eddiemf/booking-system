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

  return {
    database: {
      url: databaseUrl,
    },
  };
}
