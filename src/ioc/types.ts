const TYPES = {
  // Common
  CommonService: Symbol.for('CommonService'),
  SchedulerService: Symbol.for('SchedulerService'),
  MongooseService: Symbol.for('MongooseService'),
  BodyValidationMiddleware: Symbol.for('BodyValidationMiddleware'),
  PermissionMiddleware: Symbol.for('PermissionMiddleware'),
  imageUpdateMiddleware: Symbol.for('imageUpdateMiddleware'),

  // Auth
  AuthService: Symbol.for('AuthService'),
  AuthMiddlware: Symbol.for('AuthMiddlware'),
  JwtMiddleware: Symbol.for('JwtMiddleware'),
  AuthController: Symbol.for('AuthController'),

  // Users
  UsersDao: Symbol.for('UsersDao'),
  UsersService: Symbol.for('UsersService'),
  UsersController: Symbol.for('UsersController'),
  UsersMiddleware: Symbol.for('UsersMiddleware'),

  // Trips
  TripsDao: Symbol.for('TripsDao'),
  TripsService: Symbol.for('TripsService'),
  TripsController: Symbol.for('TripsController'),

  // Reviews
  ReviewsDao: Symbol.for('ReviewsDao'),
  ReviewsService: Symbol.for('ReviewsService'),
  ReviewsController: Symbol.for('ReviewsController'),

  // Cities
  CitiesDao: Symbol.for('CitiesDao'),
  CitiesService: Symbol.for('CitiesService'),
  CitiesController: Symbol.for('CitiesController'),

  // Tickets
  TicketsDao: Symbol.for('TicketsDao'),
  TicketsService: Symbol.for('TicketsService'),
  TicketsController: Symbol.for('TicketsController'),

  // Buses
  BusesDao: Symbol.for('BusesDao'),
  BusesService: Symbol.for('BusesService'),
  BusesController: Symbol.for('BusesController'),
};

export { TYPES };
