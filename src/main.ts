import { configDotenv } from 'dotenv';
import { createServer } from './infrastructure/server';

configDotenv();

const server = createServer();

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
