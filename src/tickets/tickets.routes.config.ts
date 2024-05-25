import express from 'express';
import { body } from 'express-validator';

import { CommonRoutesConfig } from '../common/common.routes.config';
import ticketsController from './controllers/tickets.controller';
import jwtMiddleware from '../auth/middleware/jwt.middleware';
import permissionMiddleware from '../common/middlewares/common.permission.middleware';
import { permissionsFlags } from '../common/enums/common.permissionflag.enum';
import bodyValidationMiddleware from '../common/middlewares/body.validation.middleware';

export class ticketsRoute extends CommonRoutesConfig {
  private jwtMiddleware;
  private permissionMiddleware;
  private bodyValidationMiddleware;
  private ticketsController;

  constructor(app: express.Application) {
    super(app, 'TicketsRoutes');

    this.jwtMiddleware = jwtMiddleware;
    this.permissionMiddleware = permissionMiddleware;
    this.bodyValidationMiddleware = bodyValidationMiddleware;
    this.ticketsController = ticketsController;

    this.configureRoutes();
  }

  configureRoutes() {
    this.app
      .route(`/v1/tickets`)
      .all(
        this.jwtMiddleware.checkValidToken,
        this.permissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.ADMIN
        )
      )
      .get(this.ticketsController.getTickets)
      .delete(this.ticketsController.deleteAllTickets);

    this.app
      .route(`/v1/tickets/:ticketId`)
      .all(
        this.jwtMiddleware.checkValidToken,
        this.permissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.ADMIN
        )
      )
      .get(this.ticketsController.getTicketById)
      .patch([
        body('status').isString(),
        this.bodyValidationMiddleware.verifyBodyFieldsError(['status']),
        this.ticketsController.updateTicketById,
      ])
      .delete(this.ticketsController.deleteTicketById);

    this.app
      .route(`/v1/trips/:tripId/tickets/:seatNumber`)
      .all(this.jwtMiddleware.checkValidToken)
      .post(this.ticketsController.createTicket);

    return this.app;
  }
}
