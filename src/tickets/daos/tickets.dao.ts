import debug from 'debug';
import shortid from 'shortid';

import { injectable, inject } from 'inversify';
import mongooseService from '../../common/service/mongoose.service';
import AppError from '../../common/types/appError';
import { UsersDao } from '../../users/daos/users.dao';
import { TripsDao } from '../../trips/daos/trips.dao';
import { BusesDao } from '../../buses/daos/buses.dao';
import { PatchTicketDto } from '../dtos/patch.ticket.dto';
import { CreateTicketDto } from '../dtos/create.ticket.dto';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import { CommonService } from '../../common/service/common.service';
import { TYPES } from '../../ioc/types';

const log: debug.IDebugger = debug('app:trips-dao');

@injectable()
class TicketsDao {
  constructor(
    @inject(TYPES.CommonService) private commonService: CommonService,
    @inject(TYPES.UsersDao) private usersDao: UsersDao,
    @inject(TYPES.TripsDao) private tripsDao: TripsDao,
    @inject(TYPES.BusesDao) private busesDao: BusesDao
  ) {
    log('Created new instance of TicketsDao');

    this.Ticket = this.commonService.getOrCreateModel(
      this.ticketSchema,
      'Ticket'
    );
  }

  async createTicket(seatNumber: number, tripId: string, userId: string) {
    try {
      if (!seatNumber || !tripId || !userId) {
        throw new AppError(
          true,
          'InvalidInputError',
          HttpStatusCode.BadRequest,
          'Invalid input provided'
        );
      }

      const [user, trip] = await Promise.all([
        this.usersDao.getUserById(userId),
        this.tripsDao.getById(tripId),
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

      const ticketId = shortid.generate();
      const ticketData: CreateTicketDto = {
        //@ts-ignore
        userId: user._id,
        tripId: trip._id,
        seatNumber: seatNumber,
        price: trip.price,
      };

      const ticket = new this.Ticket({
        _id: ticketId,
        ...ticketData,
      });

      await ticket.save();
      await this.tripsDao.updateBookedSeats(tripId, seatNumber);

      return ticketId;
    } catch (error) {
      throw error;
    }
  }

  async getTicketById(ticketId: string) {
    try {
      const ticket = await this.Ticket.findById({ _id: ticketId }).exec();
      if (!ticket) {
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.BadRequest,
          'Ticket not found'
        );
      }

      return ticket;
    } catch (error) {
      throw error;
    }
  }

  async getTickets(limit = 25, page = 0) {
    try {
      return await this.Ticket.find()
        .limit(limit)
        .skip(limit * page)
        .exec();
    } catch (error) {
      throw error;
    }
  }

  async updateTicketById(ticketId: string, ticketFields: PatchTicketDto) {
    try {
      if (!ticketFields.status)
        throw new AppError(
          true,
          'updateTicketError',
          HttpStatusCode.BadRequest,
          'status is required'
        );

      const ticket = await this.Ticket.findById({ _id: ticketId }).exec();
      if (!ticket) {
        throw new AppError(true, 'updateTicketError', 404, 'Ticket not found');
      }

      const updatedTicket = await this.Ticket.findOneAndUpdate(
        { _id: ticketId },
        { status: ticketFields.status },
        { new: true, runValidators: true }
      ).exec();

      if (!updatedTicket) {
        throw new AppError(
          false,
          'updateTicketError',
          HttpStatusCode.InternalServerError,
          'Failed to update ticket'
        );
      }

      return updatedTicket._id;
    } catch (error) {
      throw error;
    }
  }

  async deleteTicketById(ticketId: string) {
    try {
      const ticket = await this.Ticket.findById({ _id: ticketId }).exec();
      if (!ticket) {
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'Ticket not found'
        );
      }

      await this.Ticket.deleteOne({
        _id: ticketId,
      }).exec();
      await this.tripsDao.removeBookedSeat(ticket.tripId, ticket.seatNumber);
    } catch (error) {
      throw error;
    }
  }

  async deleteTicketsByTripId(tripId: string) {
    try {
      await this.Ticket.deleteMany({ tripId: tripId }).exec();
    } catch (error) {
      throw error;
    }
  }

  async deleteAllTickets() {
    try {
      await this.Ticket.deleteMany({}).exec();
      this.tripsDao.resetBookedSeatsForAllTrips();
    } catch (error) {
      throw error;
    }
  }

  async validateSeatNumber(seatNumber: number, trip) {
    const bus = await this.busesDao.getBusById(trip.busId);
    if (seatNumber > bus.seats || seatNumber < 1) {
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
        'Seat already booked'
      );
    }
  }

  async updateTicketStatusByTrip(tripId: string) {
    const tickets = await this.Ticket.find({
      tripId: tripId,
      status: 'active',
    }).exec();
    if (!tickets) return;

    await Promise.all(
      tickets.map(async (ticket) => {
        await this.Ticket.findByIdAndUpdate(ticket._id, {
          status: 'expired',
        }).exec();
      })
    );
  }

  schema = mongooseService.getMongoose().Schema;

  ticketSchema = new this.schema(
    {
      _id: String,
      userId: { type: String, required: true },
      tripId: { type: String, required: true },
      seatNumber: { type: Number, required: true },
      status: {
        type: String,
        enum: ['active', 'canceled', 'expired'],
        default: 'active',
      },
      price: { type: Number, required: true },
      createdAt: { type: Date },
      updatedAt: { type: Date },
    },
    { id: false }
  ).pre('save', function (next) {
    if (!this.createdAt) {
      this.createdAt = new Date();
    }

    this.updatedAt = new Date();
    next();
  });

  Ticket = this.commonService.getOrCreateModel(this.ticketSchema, 'Ticket');
}

export { TicketsDao };
