import express from 'express';
import { body } from 'express-validator';

import { CommonRoutesConfig } from '../common/common.routes.config';
import ticketsController from './controllers/tickets.controller';
import jwtMiddleware from '../auth/middleware/jwt.middleware';
import PermissionMiddleware from '../common/middleware/common.permission.middleware';
import { permissionsFlags } from '../common/enums/common.permissionflag.enum';
import bodyValidationMiddleware from '../common/middleware/body.validation.middleware';

export class ticketsRoute extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, 'TicketsRoutes');
  }

  configureRoutes() {
    this.app
      .route(`/v1/tickets`)
      .all(
        jwtMiddleware.checkValidToken,
        PermissionMiddleware.permissionsFlagsRequired(permissionsFlags.ADMIN)
      )
      .get(ticketsController.getTickets)
      .delete(ticketsController.deleteAllTickets);

    this.app
      .route(`/v1/tickets/:ticketId`)
      .all(
        jwtMiddleware.checkValidToken,
        PermissionMiddleware.permissionsFlagsRequired(permissionsFlags.ADMIN)
      )
      .get(ticketsController.getTicketById)
      .patch([
        body('status').isString(),
        bodyValidationMiddleware.verifyBodyFieldsError(['status']),
        ticketsController.updateTicketById,
      ])
      .delete(ticketsController.deleteTicketById);

    this.app
      .route(`/v1/trips/:tripId/tickets/:seatNumber`)
      .all(jwtMiddleware.checkValidToken)
      .post(ticketsController.createTicket);

    return this.app;
  }
}
