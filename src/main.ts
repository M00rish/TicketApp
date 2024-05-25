import { TripsDao } from './trips/daos/trips.dao';
import { UsersDao } from './users/daos/users.dao';
import { ReviewsDao } from './reviews/daos/reviews.dao';
import { BusesDao } from './buses/daos/buses.dao';
import { CitiesDao } from './cities/daos/cities.dao';
import { TicketsDao } from './tickets/daos/tickets.dao';

import { SchedulerService } from './common/service/scheduler.service';
import { CommonService } from './common/service/common.service';
import { MongooseService } from './common/service/mongoose.service';
import { AuthService } from './auth/services/auth.service';
import { TripsService } from './trips/services/trips.service';
import { UsersService } from './users/services/users.service';
import { ReviewsService } from './reviews/services/reviews.service';
import { BusesService } from './buses/services/buses.service';
import { CitiesService } from './cities/services/cities.service';
import { TicketsService } from './tickets/services/tickets.service';

import { UsersMiddleware } from './users/middleware/users.middleware';
import { PermissionMiddleware } from './common/middlewares/common.permission.middleware';
import { BodyValidationMiddleware } from './common/middlewares/body.validation.middleware';
import { ImageUpdateMiddleware } from './common/middlewares/image.update.middleware';
import { ErrorHandler } from './common/middlewares/error.handler.middleware';
import { AuthMiddlware } from './auth/middleware/auth.middleware';
import { JwtMiddleware } from './auth/middleware/jwt.middleware';

import { AuthController } from './auth/controllers/auth.controller';
import { BusesController } from './buses/controllers/buses.controller';
import { CitiesController } from './cities/controllers/cities.controller';
import { ReviewsController } from './reviews/controllers/reviews.controllers';
import { TicketsController } from './tickets/controllers/tickets.controller';
import { TripsController } from './trips/controllers/trips.controller';
import { UsersController } from './users/controllers/users.controller';

function init() {
  const errorHandler = new ErrorHandler();
  const imageupdateMiddleware = new ImageUpdateMiddleware();
  const jwtMiddleware = new JwtMiddleware();
  const bodyValidationMiddleware = new BodyValidationMiddleware();
  const mongooseService = new MongooseService();
  const commonService = new CommonService(mongooseService);
  // const reviewsService = new ReviewsService(commonService);
  // const permissionMiddleware = new PermissionMiddleware(ReviewsService);
  const usersdao = new UsersDao(commonService);
  const reviewsdao = new ReviewsDao(commonService);
  const busesdao = new BusesDao(commonService);
  const citiesdao = new CitiesDao(commonService);
  const busesService = new BusesService(busesdao);
  const citiesService = new CitiesService(citiesdao);
  const usersService = new UsersService(usersdao);
  const authService = new AuthService(usersService);

  // const tripsService = new TripsService(TripsDao);
  // const tripsdao = new TripsDao(commonService);

  return {
    errorHandler,
    imageupdateMiddleware,
    jwtMiddleware,
    bodyValidationMiddleware,
    mongooseService,
    commonService,
    usersdao,
    reviewsdao,
    busesdao,
    citiesdao,
    // tripsdao,
  };
}

export default init();
