import debug from 'debug';
import shortid from 'shortid';

import mongooseService from '../../common/service/mongoose.service';
import { CreateTicketDto } from '../dtos/create.ticket.dto';
import AppError from '../../common/types/appError';
import usersDao from '../../users/daos/users.dao';
import tripsDao from '../../trips/daos/trips.dao';
// import { PatchTicketDto } from '../dtos/patch.ticket.dto';

const log: debug.IDebugger = debug('app:trips-dao');

class TicketsDao {
  async createTicket(tripId, userId) {
    try {
      const ticketData = await this.generateTicketData(tripId, userId);
      const ticketId = shortid.generate();
      const ticket = new this.Ticket({
        _id: ticketId,
        ...ticketData,
      });

      await ticket.save();
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

  async updateTicketById(ticketId: string, ticketFields) {
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

      const ticketData = {
        startCity: trip.startCity,
        endCity: trip.finishCity,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        duration: trip.duration,
        seatNumber: trip.seats - trip.bookedSeats,
        passenger: {
          name: `${user.firstName} ${user.lastName}`,
        },
        price: trip.price,
        status: 'active',
        busName: trip.busId,
        payment: {
          transactionId: '',
          method: '',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return ticketData;
    } catch (error) {
      throw error;
    }
  };

  //   generateTicketData = (tripId: string, userId: string) => {
  //     return new Promise((resolve, reject) => {
  //       mongooseService
  //         .getMongoose()
  //         .model('User')
  //         .aggregate([
  //           {
  //             $match: {
  //               _id: userId,
  //             },
  //           },
  //           {
  //             $lookup: {
  //               from: 'trips',
  //               localField: tripId,
  //               foreignField: '_id',
  //               as: 'trip',
  //             },
  //           },
  //           {
  //             $limit: 1,
  //           },
  //           {
  //             $unwind: {
  //               path: '$trip',
  //               preserveNullAndEmptyArrays: true,
  //             },
  //           },
  //           {
  //             $project: {
  //               _id: 0,
  //               firstName: '$firstName',
  //               lastName: '$lastName',
  //               startCity: '$trip.finishCity',
  //               //   finishCity: '$trip.finishCity',
  //               //   duration: '$trip.duration',
  //               //   price: '$trip.price',
  //             },
  //           },
  //         ])
  //         .exec((err, result) => {
  //           if (err) {
  //             reject(err);
  //           }
  //           if (result.length === 0) {
  //             reject(
  //               new AppError(false, 'createTicket_Error', 404, 'trip not found')
  //             );
  //           }

  //           resolve(result);
  //         });
  // });
  //   };s

  schema = mongooseService.getMongoose().Schema;

  ticketSchema = new this.schema(
    {
      _id: String,
      startCity: String,
      endCity: String,
      departureTime: Date,
      arrivalTime: Date,
      duration: String,
      seatNumber: Number,
      passenger: {
        name: String,
      },
      price: Number,
      status: String,
      busId: String,
      payment: {
        transactionId: String,
        method: String,
      },
      createdAt: Date,
      updatedAt: Date,
    },
    { id: false }
  );

  Ticket = mongooseService.getMongoose().model('Ticket', this.ticketSchema);
}

export default new TicketsDao();
