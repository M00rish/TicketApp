import ticketsService from '../services/tickets.service';
import express from 'express';

class TicketsController {
  async createTicket(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const tripId = req.params.tripId;
      const userId = res.locals.jwt.userId;
      const ticketId = await ticketsService.createTicket(tripId, userId);
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
      const ticket = await ticketsService.getTicketById(ticketId);
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
      const tickets = await ticketsService.getTickets(10, 0);
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
      const ticket = await ticketsService.updateTicketById(
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
      await ticketsService.deleteTicketById(ticketId);
      res.status(204).json();
    } catch (error) {
      next(error);
    }
  }
}

export default new TicketsController();
