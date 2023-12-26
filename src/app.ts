import express from 'express';
import http from 'http'; // /TODO: to swap with https
import winston from 'winston';
import expressWinston from 'express-winston';
import cors from 'cors';
import debug from 'debug';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

import { CommonRoutesConfig } from './common/common.routes.config';
import { UsersRoutes } from './users/users.routes.config';
import { AuthRoutes } from './auth/auth.routes.config';
import { TripsRoutes } from './trips/trips.routes.config';
import { ReviewsRoutes } from './reviews/reviews.routes.config';
import { BusesRoutes } from './buses/buses.routes.config';
import { CitiesRoutes } from './cities/cities.routes.config';
import { ticketsRoute } from './tickets/tickets.routes.config';
import ErrorHandler from './common/middlewares/error.handler.middleware';

const app: express.Application = express();
const server: http.Server = http.createServer(app);
const port = 3000;
const routes: Array<CommonRoutesConfig> = [];
const log: debug.IDebugger = debug('app');

const dotenvResults = dotenv.config();
if (dotenvResults.error) {
  throw dotenvResults.error;
}

// app.use(rateLimit({ windowMs: 60 * 1000, max: 10 }));

app.use(cors());

app.use(express.json({ limit: '10kb' }));

app.use(express.urlencoded({ extended: false }));

app.use(helmet());

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
  if (typeof global.it === 'function') {
    loggerOptions.level = 'http';
  }
}

app.use(expressWinston.logger(loggerOptions));

routes.push(new UsersRoutes(app));
routes.push(new AuthRoutes(app));
routes.push(new TripsRoutes(app));
routes.push(new ReviewsRoutes(app));
routes.push(new BusesRoutes(app));
routes.push(new CitiesRoutes(app));
routes.push(new ticketsRoute(app));

const startingMessage = `server is running on ${port}`;
app.get('/', (req: express.Request, res: express.Response) => {
  res.status(200).send(startingMessage);
});

app.use(ErrorHandler.handle);

export default app;

export const appServer = server.listen(port, () => {
  routes.forEach((route: CommonRoutesConfig) => {
    log(`Routes configured ${route.getName()}`);
  });
  console.log(startingMessage);
});
