export interface Config {
  database: {
    url: string;
  };
}

export function getConfig(): Config {
  return {
    database: {
      url: process.env.DATABASE_URL || '',
    },
  };
}
