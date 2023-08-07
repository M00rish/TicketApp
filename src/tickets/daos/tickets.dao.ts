import debug from 'debug';
import shortid from 'shortid';

import mongooseService from '../../common/service/mongoose.service';
import AppError from '../../common/types/appError';
import usersDao from '../../users/daos/users.dao';
import tripsDao from '../../trips/daos/trips.dao';
import { PatchTicketDto } from '../dtos/patch.ticket.dto';
import { CreateTicketDto } from '../dtos/create.ticket.dto';

const log: debug.IDebugger = debug('app:trips-dao');

class TicketsDao {
  async createTicket(tripId, userId) {
    try {
      const user = await usersDao.getUserById(userId);
      const trip = await tripsDao.getTripById(tripId);

      if (!user || !trip) {
        throw new AppError(false, 'createTicket_Error', 404, 'trip not found');
      }

      const ticketData: CreateTicketDto = {
        userId: user._id,
        tripId: trip._id,
        seatNumber: trip.seats - trip.bookedSeats,
        price: trip.price,
      };

      const ticketId = shortid.generate();
      const ticket = new this.Ticket({
        _id: ticketId,
        ...ticketData,
      });

      await ticket.save();
      await tripsDao.updateBookedSeats(tripId);
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
          'getTicketById_Error',
          404,
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
      const ticket = await this.Ticket.findById({ _id: ticketId }).exec();
      if (!ticket) {
        throw new AppError(
          true,
          'updateTicketById_Error',
          404,
          'Ticket not found'
        );
      }

      const updatedTicket = await this.Ticket.findOneAndUpdate(
        { _id: ticketId },
        { $set: ticketFields },
        { new: true }
      ).exec();

      if (!updatedTicket) {
        throw new AppError(
          false,
          'updateTicketById_Error',
          500,
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
      const ticket = await this.Ticket.deleteOne({ _id: ticketId }).exec();
      if (ticket.deletedCount === 0) {
        throw new AppError(
          true,
          'deleteTicketById_Error',
          404,
          'Ticket not found'
        );
      }
    } catch (error) {
      throw error;
    }
  }

  generateTicketData = async (tripId: string, userId: string) => {
    try {
      const user = await usersDao.getUserById(userId);
      const trip = await tripsDao.getTripById(tripId);

      if (!user || !trip) {
        throw new AppError(false, 'createTicket_Error', 404, 'trip not found');
      }

      const ticketData: CreateTicketDto = {
        userId: user._id,
        tripId: trip._id,
        seatNumber: trip.seats - trip.bookedSeats,
        price: trip.price,
      };

      return ticketData;
    } catch (error) {
      throw error;
    }
  };

  schema = mongooseService.getMongoose().Schema;

  ticketSchema = new this.schema(
    {
      _id: String,
      userId: { type: String, required: true },
      tripId: { type: String, required: true },
      seatNumber: { type: Number, required: true },
      status: {
        type: String,
        enum: ['active', 'canceled', 'completed'],
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

  Ticket = mongooseService.getMongoose().model('Ticket', this.ticketSchema);
}

export default new TicketsDao();
