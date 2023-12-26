import debug from 'debug';
import { CRUD } from '../../common/interfaces/crud.interface';
import { TicketsDao } from '../daos/tickets.dao';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';

const log: debug.IDebugger = debug('app:tickets-service');

@injectable()
class TicketsService implements CRUD {
  constructor(@inject(TYPES.TicketsDao) private ticketsDao) {
    log('Created new instance of TicketsService');
  }

  async create(ressource: any) {
    return this.ticketsDao.createTicket(ressource);
  }
  async getById(ticketId: string) {
    return this.ticketsDao.getTicketById(ticketId);
  }

  async list(limit = 25, page = 0) {
    return this.ticketsDao.getTickets(limit, page);
  }

  async updateById(ticketId: string, ticketFields: any) {
    return this.ticketsDao.updateTicketById(ticketId, ticketFields);
  }

  async deleteById(ticketId: string) {
    return this.ticketsDao.deleteTicketById(ticketId);
  }

  async deleteAllTickets() {
    return this.ticketsDao.deleteAllTickets();
  }

  async updateTicketStatusByTrip(tripId: string) {
    return this.ticketsDao.updateTicketStatusByTrip(tripId);
  }
}

export { TicketsService };
