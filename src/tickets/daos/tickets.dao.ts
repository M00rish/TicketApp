import debug from 'debug';
import shortid from 'shortid';

import { injectable, inject } from 'inversify';
import { PatchTicketDto } from '../dtos/patch.ticket.dto';
import { CreateTicketDto } from '../dtos/create.ticket.dto';
import { CommonService } from '../../common/service/common.service';
import { TYPES } from '../../ioc/types';

const log: debug.IDebugger = debug('app:trips-dao');

class TicketsDao {
  constructor(private commonService: CommonService) {
    log('Created new instance of TicketsDao');

    this.Ticket = this.commonService.getOrCreateModel(
      'Ticket',
      this.ticketSchema
    );
  }

  /**
   * Creates a new ticket.
   * @param ticketData - The data for the ticket.
   * @returns The ID of the created ticket.
   */
  async create(ticketData: CreateTicketDto) {
    const ticketId = shortid.generate();
    const ticket = new this.Ticket({
      _id: ticketId,
      ...ticketData,
    });
    await ticket.save();
    return ticketId;
  }

  /**
   * Retrieves a ticket by its ID.
   * @param ticketId - The ID of the ticket to retrieve.
   * @returns A promise that resolves to the ticket object.
   */
  async getById(ticketId: string) {
    return await this.Ticket.findById({ _id: ticketId }).exec();
  }

  /**
   * Retrieves a list of tickets.
   *
   * @param limit - The maximum number of tickets to retrieve. Default is 25.
   * @param page - The page number of the results. Default is 0.
   * @returns A promise that resolves to an array of tickets.
   */
  async list(limit = 25, page = 0) {
    return await this.Ticket.find()
      .limit(limit)
      .skip(limit * page)
      .exec();
  }

  /**
   * Updates a ticket by its ID.
   * @param {string} ticketId - The ID of the ticket to update.
   * @param {PatchTicketDto} ticketFields - The fields to update in the ticket.
   * @returns {Promise<Ticket>} - A promise that resolves to the updated ticket.
   */
  async updateById(ticketId: string, ticketFields: PatchTicketDto) {
    return await this.Ticket.findOneAndUpdate(
      { _id: ticketId },
      { status: ticketFields.status },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Deletes a ticket by its ID.
   * @param {string} ticketId - The ID of the ticket to delete.
   * @returns {Promise<void>} - A promise that resolves when the ticket is deleted.
   */
  async deleteById(ticketId: string) {
    await this.Ticket.deleteOne({
      _id: ticketId,
    }).exec();
  }

  /**
   * Deletes tickets by trip ID.
   * @param tripId - The ID of the trip.
   * @returns A promise that resolves when the tickets are deleted.
   */
  async deleteTicketsByTripId(tripId: string) {
    await this.Ticket.deleteMany({ tripId: tripId }).exec();
  }

  /**
   * Deletes all tickets from the database.
   */
  async deleteAllTickets() {
    await this.Ticket.deleteMany({}).exec();
  }

  /**
   * Updates the status of all tickets associated with a given trip.
   * @param tripId - The ID of the trip.
   * @returns A promise that resolves when all tickets have been updated.
   */
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

  schema = this.commonService.getMongoose().Schema;

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

  Ticket = this.commonService.getOrCreateModel('Ticket', this.ticketSchema);
}

export { TicketsDao };
