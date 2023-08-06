import express from 'express';

import { CommonRoutesConfig } from '../common/common.routes.config';
import ticketsController from './controllers/tickets.controller';
import jwtMiddleware from '../auth/middleware/jwt.middleware';
import commonPermissionMiddleware from '../common/middleware/common.permission.middleware';
import { permissionsFlags } from '../common/enums/common.permissionflag.enum';

export class ticketsRoute extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, 'TicketsRoute');
  }

  configureRoutes() {
    this.app
      .route(`/v1/tickets`)
      .all(
        jwtMiddleware.checkValidToken,
        commonPermissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.ADMIN
        )
      )
      .get(ticketsController.getTickets);

    this.app
      .route(`/v1/tickets/:ticketId`)
      .all(
        jwtMiddleware.checkValidToken,
        commonPermissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.ADMIN
        )
      )
      .get(ticketsController.getTicketById)
      .patch(ticketsController.updateTicketById)
      .delete(ticketsController.deleteTicketById);

    this.app
      .route(`/v1/trips/:tripId/tickets`)
      .all(jwtMiddleware.checkValidToken)
      .post(ticketsController.createTicket);

    return this.app;
  }
}
