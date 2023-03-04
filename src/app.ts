import express from 'express';
import http from 'http';

import winston from 'winston';
import expressWinston from 'express-winston';
import cors from 'cors';
import debug from 'debug';
import dotenv from 'dotenv';

import { CommonRoutesConfig } from './common/common.routes.config';
import { UsersRoutes } from './users/users.routes.config';
import { AuthRoutes } from './auth/auth.routes.config';

const app: express.Application = express();
const server: http.Server = http.createServer(app);
const port = 3000;
const routes: Array<CommonRoutesConfig> = [];
const log: debug.IDebugger = debug('app');

const dotenvResults = dotenv.config();
if (dotenvResults.error) {
  throw dotenvResults.error;
}

app.use(express.json());

app.use(cors());

const loggerOptions: expressWinston.LoggerOptions = {
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.json(),
    winston.format.prettyPrint(),
    winston.format.colorize({ all: true })
  ),
};

if (!process.env.DEBUG) {
  loggerOptions.meta = false;
}

app.use(expressWinston.logger(loggerOptions));

routes.push(new UsersRoutes(app));
routes.push(new AuthRoutes(app));

const startingMessage = `server is running on ${port}`;
app.get('/', (req: express.Request, res: express.Response) => {
  res.status(200).send(startingMessage);
});

server.listen(port, () => {
  routes.forEach((route: CommonRoutesConfig) => {
    log(`Routes configured ${route.getName()}`);
  });
  console.log(startingMessage);
});
