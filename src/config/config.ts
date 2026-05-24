export function getConfig() {
  return {
    database: {
      url: process.env.DATABASE_URL || '',
    },
  };
}
