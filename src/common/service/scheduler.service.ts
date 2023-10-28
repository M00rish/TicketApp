import { Agenda } from '@hokify/agenda';
import debug from 'debug';

import mongooseService from './mongoose.service';
import tripsService from '../../trips/services/trips.service';
import ticketsService from '../../tickets/services/tickets.service';

const log: debug.IDebugger = debug('app:scheduler-service');

class SchedulerService {
  private agenda: Agenda;

  constructor() {
    this.agenda = new Agenda({
      db: { address: mongooseService.DB_URI },
    });

    this.initAgenda();
  }

  private async initAgenda(): Promise<void> {
    this.agenda.define(`tripStatusJob`, async (job) => {
      try {
        tripsService.updateTripStatus(job.attrs.data.tripId);
      } catch (error) {
        throw error;
      }
    });

    this.agenda.define(`ticketStatusJob`, async (job) => {
      try {
        ticketsService.updateTicketStatusByTrip(job.attrs.data.tripId);
      } catch (error) {
        throw error;
      }
    });

    this.agenda.on('success', (job) => {
      job.remove();
    });

    await this.agenda.start();
  }

  public async scheduleStatusUpdate(
    tripId: string,
    arrivalTime: Date
  ): Promise<void> {
    try {
      await this.agenda.schedule(arrivalTime, 'tripStatusJob', { tripId });
      await this.agenda.schedule(arrivalTime, 'ticketStatusJob', { tripId });
    } catch (error) {
      throw error;
    }
  }

  public async updateScheduledTime(
    tripId: string,
    arrivalTime: Date
  ): Promise<void> {
    try {
      await this.agenda.cancel({
        name: 'tripStatusJob',
        'data.tripId': tripId,
      });

      await this.agenda.cancel({
        name: 'ticketStatusJob',
        'data.tripId': tripId,
      });

      await this.agenda.schedule(arrivalTime, 'ticketStatusJob', { tripId });
      await this.agenda.schedule(arrivalTime, 'tripStatusJob', { tripId });
    } catch (error) {
      throw error;
    }
  }

  public async cancelScheduledTime(tripId: string): Promise<void> {
    try {
      await this.agenda.cancel({
        name: 'tripStatusJob',
        'data.tripId': tripId,
      });

      await this.agenda.cancel({
        name: 'ticketStatusJob',
        'data.tripId': tripId,
      });
    } catch (error) {
      throw error;
    }
  }
}

export default new SchedulerService();
