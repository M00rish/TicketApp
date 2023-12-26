import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';
import { TripsDao } from '../trips/daos/trips.dao';
import { TripsService } from '../trips/services/trips.service';
import { TripsController } from '../trips/controllers/trips.controller';
import { SchedulerService } from '../common/service/scheduler.service';
import { CommonService } from '../common/service/common.service';
import { CitiesDao } from '../cities/daos/cities.dao';
import { CitiesService } from '../cities/services/cities.service';
import { CitiesController } from '../cities/controllers/cities.controller';
import { TicketsDao } from '../tickets/daos/tickets.dao';
import { TicketsService } from '../tickets/services/tickets.service';
import { TicketsController } from '../tickets/controllers/tickets.controller';
import { MongooseService } from '../common/service/mongoose.service';
import { AuthService } from '../auth/services/auth.service';
import { AuthController } from '../auth/controllers/auth.controller';
import { AuthMiddlware } from '../auth/middleware/auth.middleware';
import { JwtMiddleware } from '../auth/middleware/jwt.middleware';
import { UsersController } from '../users/controllers/users.controller';
import { UsersMiddleware } from '../users/middleware/users.middleware';
import { UsersDao } from '../users/daos/users.dao';
import { UsersService } from '../users/services/users.service';
import { BodyValidationMiddleware } from '../common/middlewares/body.validation.middleware';
import { PermissionMiddleware } from '../common/middlewares/common.permission.middleware';
import { BusesController } from '../buses/controllers/buses.controller';
import { BusesDao } from '../buses/daos/buses.dao';
import { BusesService } from '../buses/services/buses.service';
import { ReviewsController } from '../reviews/controllers/reviews.controllers';
import { ReviewsDao } from '../reviews/daos/reviews.dao';
import { ReviewsService } from '../reviews/services/reviews.service';

const container = new Container();

// Common
container
  .bind<MongooseService>(TYPES.MongooseService)
  .to(MongooseService)
  .inSingletonScope();
container
  .bind<CommonService>(TYPES.CommonService)
  .to(CommonService)
  .inSingletonScope();
container
  .bind<SchedulerService>(TYPES.SchedulerService)
  .to(SchedulerService)
  .inSingletonScope();
container
  .bind<BodyValidationMiddleware>(TYPES.BodyValidationMiddleware)
  .to(BodyValidationMiddleware)
  .inSingletonScope();
container
  .bind<PermissionMiddleware>(TYPES.PermissionMiddleware)
  .to(PermissionMiddleware)
  .inSingletonScope();

// Trips
container.bind<TripsDao>(TYPES.TripsDao).to(TripsDao).inSingletonScope();
container
  .bind<TripsService>(TYPES.TripsService)
  .to(TripsService)
  .inSingletonScope();
container
  .bind<TripsController>(TYPES.TripsController)
  .to(TripsController)
  .inSingletonScope();

//Auth
container
  .bind<AuthService>(TYPES.AuthService)
  .to(AuthService)
  .inSingletonScope();
container
  .bind<AuthMiddlware>(TYPES.AuthMiddlware)
  .to(AuthMiddlware)
  .inSingletonScope();
container
  .bind<JwtMiddleware>(TYPES.JwtMiddleware)
  .to(JwtMiddleware)
  .inRequestScope();
container
  .bind<AuthController>(TYPES.AuthController)
  .to(AuthController)
  .inSingletonScope();

// Cities
container.bind<CitiesDao>(TYPES.CitiesDao).to(CitiesDao).inSingletonScope();
container
  .bind<CitiesService>(TYPES.CitiesService)
  .to(CitiesService)
  .inSingletonScope();
container
  .bind<CitiesController>(TYPES.CitiesController)
  .to(CitiesController)
  .inSingletonScope();

// Tickets
container.bind<TicketsDao>(TYPES.TicketsDao).to(TicketsDao).inSingletonScope();
container
  .bind<TicketsService>(TYPES.TicketsService)
  .to(TicketsService)
  .inSingletonScope();
container
  .bind<TicketsController>(TYPES.TicketsController)
  .to(TicketsController)
  .inSingletonScope();

// Users
container.bind<UsersDao>(TYPES.UsersDao).to(UsersDao).inSingletonScope();
container
  .bind<UsersService>(TYPES.UsersService)
  .to(UsersService)
  .inSingletonScope();
container
  .bind<UsersController>(TYPES.UsersController)
  .to(UsersController)
  .inSingletonScope();
container
  .bind<UsersMiddleware>(TYPES.UsersMiddleware)
  .to(UsersMiddleware)
  .inSingletonScope();

// Buses
container.bind<BusesDao>(TYPES.BusesDao).to(BusesDao).inSingletonScope();
container
  .bind<BusesService>(TYPES.BusesService)
  .to(BusesService)
  .inSingletonScope();
container
  .bind<BusesController>(TYPES.BusesController)
  .to(BusesController)
  .inSingletonScope();

// Reviews
container.bind<ReviewsDao>(TYPES.ReviewsDao).to(ReviewsDao).inSingletonScope();
container
  .bind<ReviewsService>(TYPES.ReviewsService)
  .to(ReviewsService)
  .inSingletonScope();
container
  .bind<ReviewsController>(TYPES.ReviewsController)
  .to(ReviewsController)
  .inSingletonScope();

console.log('container', container);

console.log('container', container.resolve(TripsDao));

export { container };
