import { z } from 'zod';
import { getZodErrorMap } from '@shared/get-zod-error-map';
import { startServer } from './infrastructure/api/server';

z.setErrorMap(getZodErrorMap());
startServer();
