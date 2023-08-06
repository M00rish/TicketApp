import ticketsDao from '../daos/tickets.dao';

class TicketsService {
  async createTicket(tripId, userId) {
    return await ticketsDao.createTicket(tripId, userId);
  }
  async getTicketById(ticketId: string) {
    return await ticketsDao.getTicketById(ticketId);
  }
  async getTickets(limit = 25, page = 0) {
    return await ticketsDao.getTickets(limit, page);
  }

  async updateTicketById(ticketId: string, ticketFields) {
    return await ticketsDao.updateTicketById(ticketId, ticketFields);
  }

  async deleteTicketById(ticketId: string) {
    return await ticketsDao.deleteTicketById(ticketId);
  }
}

export default new TicketsService();
