import express from 'express';
import debug from 'debug';

import ticketsService, { TicketsService } from '../services/tickets.service';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../ioc/types';

const log: debug.IDebugger = debug('app:tickets-controller');

class TicketsController {
  constructor(private ticketsService: TicketsService) {
    log('Created new instance of TicketsController');
  }

  async createTicket(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const tripId: String = req.params.tripId;
      const userId: String = res.locals.jwt.userId;
      const seatNumber: Number = Number(req.params.seatNumber);
      const ressource = {
        tripId,
        userId,
        seatNumber,
      };
      const ticketId = await this.ticketsService.create(ressource);
      res.status(201).json({ _id: ticketId });
    } catch (error) {
      next(error);
    }
  }

  async getTicketById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const ticketId = req.params.ticketId;
      const ticket = await this.ticketsService.getById(ticketId);
      res.status(200).json({ ticket });
    } catch (error) {
      next(error);
    }
  }

  async getTickets(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const tickets = await this.ticketsService.list(10, 0);
      res.status(200).json({ tickets });
    } catch (error) {
      next(error);
    }
  }

  async updateTicketById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const ticketId = req.params.ticketId;
      const ticketUpdate = req.body;
      const ticket = await this.ticketsService.updateById(
        ticketId,
        ticketUpdate
      );
      res.status(200).json({ ticket });
    } catch (error) {
      next(error);
    }
  }

  async deleteTicketById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const ticketId = req.params.ticketId;
      await this.ticketsService.deleteById(ticketId);
      res.status(204).json();
    } catch (error) {
      next(error);
    }
  }

  async deleteAllTickets(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      await this.ticketsService.deleteAllTickets();
      res.status(204).json();
    } catch (error) {
      next(error);
    }
  }
}

export { TicketsController };
export default new TicketsController(ticketsService);
