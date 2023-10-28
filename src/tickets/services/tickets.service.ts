import debug from 'debug';
import { CRUD } from '../../common/interfaces/crud.interface';
import ticketsDao from '../daos/tickets.dao';

const log: debug.IDebugger = debug('app:tickets-service');

class TicketsService implements CRUD {
  constructor(private ticketsDao) {
    log('created new instance of TicketsService');
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

export default new TicketsService(ticketsDao);
