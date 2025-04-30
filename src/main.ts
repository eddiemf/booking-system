import { configDotenv } from 'dotenv';
import { z } from 'zod';
import { getZodErrorMap } from '@shared/get-zod-error-map';
import { startServer } from './infrastructure/api/server';

configDotenv();

z.setErrorMap(getZodErrorMap());
startServer();
