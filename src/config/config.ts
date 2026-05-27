export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === null) {
    throw new ConfigError(`${name} environment variable is required.`);
  }
  return value;
}

export function getConfig() {
  return {
    database: {
      url: requireEnv('DATABASE_URL'),
    },
    auth: {
      jwtSecret: requireEnv('JWT_SECRET'),
      googleClientId: requireEnv('GOOGLE_CLIENT_ID'),
      appleClientId: requireEnv('APPLE_CLIENT_ID'),
    },
  };
}