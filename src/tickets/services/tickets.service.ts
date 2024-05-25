import debug from 'debug';
import { CRUD } from '../../common/interfaces/crud.interface';
import { TicketsDao } from '../daos/tickets.dao';
import { UsersService } from '../../users/services/users.service';
import { TripsService } from '../../trips/services/trips.service';
import { BusesService } from '../../buses/services/buses.service';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';
import { CreateTicketDto } from '../dtos/create.ticket.dto';
import { th } from 'date-fns/locale';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import shortid from 'shortid';

const log: debug.IDebugger = debug('app:tickets-service');

class TicketsService implements CRUD {
  constructor(
    private ticketsDao: TicketsDao,
    private usersService: UsersService,
    private tripsService: TripsService,
    private busesService: BusesService
  ) {
    log('Created new instance of TicketsService');
  }

  /**
   * Creates a new ticket.
   * @param ticketDto - The ticket data transfer object.
   * @returns The ID of the created ticket.
   * @throws {AppError} If the input is invalid, user or trip is not found, or the trip has already started.
   */
  async create(ticketDto: CreateTicketDto) {
    try {
      const { seatNumber, tripId, userId } = ticketDto;

      if (!seatNumber || !tripId || !userId) {
        throw new AppError(
          true,
          'InvalidInputError',
          HttpStatusCode.BadRequest,
          'Invalid input provided'
        );
      }

      const [user, trip] = await Promise.all([
        this.usersService.getById(userId),
        this.tripsService.getById(tripId),
      ]);

      if (!user || !trip) {
        throw new AppError(
          true,
          'ResourceNotFoundError',
          HttpStatusCode.NotFound,
          'User or trip not found'
        );
      }

      if (trip.departureTime < new Date()) {
        throw new AppError(
          true,
          'TripTimeExpiredError',
          HttpStatusCode.BadRequest,
          'Trip has started already'
        );
      }
      await this.validateSeatNumber(seatNumber, trip);

      const ticketData: CreateTicketDto = {
        //@ts-ignore
        userId: user._id,
        tripId: trip._id,
        seatNumber: seatNumber,
        price: trip.price,
      };

      const ticketId = await this.ticketsDao.create(ticketData);
      await this.tripsService.updateBookedSeats(tripId, seatNumber);
      return ticketId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves a ticket by its ID.
   * @param ticketId - The ID of the ticket to retrieve.
   * @returns The ticket object if found, otherwise throws an error.
   * @throws {AppError} If the ticket is not found.
   */
  async getById(ticketId: string) {
    try {
      const ticket = await this.ticketsDao.getById(ticketId);
      if (!ticket)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.BadRequest,
          'Ticket not found'
        );
      return ticket;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves a list of tickets.
   *
   * @param limit - The maximum number of tickets to retrieve (default: 25).
   * @param page - The page number of the results to retrieve (default: 0).
   * @returns A Promise that resolves to an array of tickets.
   * @throws If an error occurs while retrieving the tickets.
   */
  async list(limit = 25, page = 0) {
    try {
      const tickets = await this.ticketsDao.list(limit, page);
      return tickets;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates a ticket by its ID.
   *
   * @param {string} ticketId - The ID of the ticket to update.
   * @param {any} ticketFields - The updated fields for the ticket.
   * @returns {Promise<void>} - A promise that resolves when the ticket is successfully updated.
   * @throws {AppError} - If the ticket is not found or if the status field is missing in the ticketFields object.
   * @throws {AppError} - If there is an error updating the ticket.
   */
  async updateById(ticketId: string, ticketFields: any) {
    try {
      const ticket = await this.getById(ticketId);
      if (!ticket)
        throw new AppError(
          true,
          'updateTicketError',
          HttpStatusCode.BadRequest,
          'Ticket not found'
        );

      if (!ticketFields.status)
        throw new AppError(
          true,
          'updateTicketError',
          HttpStatusCode.BadRequest,
          'status is required'
        );

      // TODO : user changing seat number should be validated

      const updatedTicket = await this.ticketsDao.updateById(
        ticketId,
        ticketFields
      );
      if (!updatedTicket)
        throw new AppError(
          false,
          'updateTicketError',
          HttpStatusCode.InternalServerError,
          'Failed to update ticket'
        );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletes a ticket by its ID.
   *
   * @param ticketId - The ID of the ticket to delete.
   * @returns A Promise that resolves when the ticket is successfully deleted.
   * @throws {AppError} If the ticket is not found.
   * @throws {Error} If an error occurs while deleting the ticket.
   */
  async deleteById(ticketId: string) {
    try {
      const ticket = await this.getById(ticketId);
      if (!ticket)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'Ticket not found'
        );

      await this.ticketsDao.deleteById(ticketId);
      await this.tripsService.removeBookedSeat(
        ticket.tripId,
        ticket.seatNumber
      );
      return;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletes tickets by trip ID.
   * @param tripId - The ID of the trip for which tickets need to be deleted.
   * @throws {Error} If an error occurs while deleting the tickets.
   */
  async deleteTicketsByTripId(tripId: string) {
    try {
      await this.ticketsDao.deleteTicketsByTripId(tripId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletes all tickets.
   * This method deletes all the tickets by calling the `deleteAllTickets` method of the `ticketsDao` object.
   * It also resets the booked seats for all trips by calling the `resetBookedSeatsForAllTrips` method of the `tripsService` object.
   * @throws {Error} If an error occurs while deleting the tickets or resetting the booked seats.
   */
  async deleteAllTickets() {
    try {
      await this.ticketsDao.deleteAllTickets();
      await this.tripsService.resetBookedSeatsForAllTrips();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates the ticket status for a given trip.
   * @param tripId - The ID of the trip.
   * @throws If an error occurs while updating the ticket status.
   */
  async updateTicketStatusByTrip(tripId: string) {
    try {
      await this.ticketsDao.updateTicketStatusByTrip(tripId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validates the seat number for a given trip.
   * @param seatNumber - The seat number to validate.
   * @param trip - The trip object.
   * @throws {AppError} - Throws an error if the seat number is invalid, all seats are booked, or the seat is already booked.
   */
  async validateSeatNumber(seatNumber: number, trip) {
    const bus = await this.busesService.getById(trip.busId);
    if (seatNumber > Number(bus.seats) || seatNumber < 1) {
      throw new AppError(
        true,
        'InvalidSeatNumberError',
        HttpStatusCode.BadRequest,
        'Invalid seat number'
      );
    }
    if (trip.bookedSeats.length === bus.seats) {
      throw new AppError(
        true,
        'NoSeatsError',
        HttpStatusCode.BadRequest,
        'No seats left'
      );
    }
    if (trip.bookedSeats.includes(seatNumber)) {
      throw new AppError(
        true,
        'SeatAlreadyBookedError',
        HttpStatusCode.BadRequest,
        'Seat is taken, please choose another seat number'
      );
    }
  }
}

export { TicketsService };
