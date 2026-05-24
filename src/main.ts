import { getZodErrorMap } from "@shared/get-zod-error-map";
import { configDotenv } from "dotenv";
import { z } from "zod";
import { startServer } from "./infrastructure/server/server";

configDotenv();

z.setErrorMap(getZodErrorMap());
startServer();
