import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { SchedulerService } from '../../../src/common/service/scheduler.service';

describe('SchedulerService', () => {
  describe('scheduleStatusUpdate', () => {
    let schedulerService: SchedulerService;
    let agendaScheduleStub: sinon.SinonStub;

    beforeEach(() => {
      schedulerService = new SchedulerService();
      agendaScheduleStub = sinon.stub(schedulerService['agenda'], 'schedule');
    });

    afterEach(() => {
      agendaScheduleStub.restore();
    });

    it('should call agenda.schedule with the correct parameters', async () => {
      const tripId = 'testTripId';
      const arrivalTime = new Date();

      agendaScheduleStub.resolves();

      await schedulerService.scheduleStatusUpdate(tripId, arrivalTime);

      expect(agendaScheduleStub.calledTwice).to.be.true;
      expect(
        agendaScheduleStub.firstCall.calledWith(arrivalTime, 'tripStatusJob', {
          tripId,
        })
      ).to.be.true;
      expect(
        agendaScheduleStub.secondCall.calledWith(
          arrivalTime,
          'ticketStatusJob',
          {
            tripId,
          }
        )
      ).to.be.true;
    });

    it('should throw an error when agenda.schedule fails', async () => {
      const tripId = 'testTripId';
      const arrivalTime = new Date();
      const testError = new Error('Test error');

      agendaScheduleStub.rejects(testError);

      try {
        await schedulerService.scheduleStatusUpdate(tripId, arrivalTime);
      } catch (error) {
        expect(error).to.equal(testError);
      }

      expect(agendaScheduleStub.calledOnce).to.be.true;
    });
  });

  describe('updateScheduledTime', () => {
    let schedulerService: SchedulerService;
    let agendaCancelStub: sinon.SinonStub;
    let agendaScheduleStub: sinon.SinonStub;

    beforeEach(() => {
      schedulerService = new SchedulerService();
      agendaCancelStub = sinon.stub(schedulerService['agenda'], 'cancel');
      agendaScheduleStub = sinon.stub(schedulerService['agenda'], 'schedule');
    });

    afterEach(() => {
      agendaCancelStub.restore();
      agendaScheduleStub.restore();
    });

    it('should call agenda.cancel and agenda.schedule with the correct parameters', async () => {
      const tripId = 'testTripId';
      const arrivalTime = new Date();

      agendaCancelStub.resolves();
      agendaScheduleStub.resolves();

      await schedulerService.updateScheduledTime(tripId, arrivalTime);

      expect(agendaCancelStub.calledTwice).to.be.true;
      expect(
        agendaCancelStub.firstCall.calledWith({
          name: 'tripStatusJob',
          'data.tripId': tripId,
        })
      ).to.be.true;
      expect(
        agendaCancelStub.secondCall.calledWith({
          name: 'ticketStatusJob',
          'data.tripId': tripId,
        })
      ).to.be.true;

      expect(agendaScheduleStub.calledTwice).to.be.true;
      expect(
        agendaScheduleStub.firstCall.calledWith(
          arrivalTime,
          'ticketStatusJob',
          { tripId }
        )
      ).to.be.true;
      expect(
        agendaScheduleStub.secondCall.calledWith(arrivalTime, 'tripStatusJob', {
          tripId,
        })
      ).to.be.true;
    });

    it('should throw an error when agenda.cancel or agenda.schedule fails', async () => {
      const tripId = 'testTripId';
      const arrivalTime = new Date();
      const testError = new Error('Test error');

      agendaCancelStub.rejects(testError);

      try {
        await schedulerService.updateScheduledTime(tripId, arrivalTime);
      } catch (error) {
        expect(error).to.equal(testError);
      }

      expect(agendaCancelStub.calledOnce).to.be.true;
    });
  });

  describe('cancelScheduledTime', () => {
    let schedulerService: SchedulerService;
    let agendaCancelStub: sinon.SinonStub;

    beforeEach(() => {
      schedulerService = new SchedulerService();
      agendaCancelStub = sinon.stub(schedulerService['agenda'], 'cancel');
    });

    afterEach(() => {
      agendaCancelStub.restore();
    });

    it('should call agenda.cancel with the correct parameters', async () => {
      const tripId = 'testTripId';

      agendaCancelStub.resolves();

      await schedulerService.cancelScheduledTime(tripId);

      expect(agendaCancelStub.calledTwice).to.be.true;
      expect(
        agendaCancelStub.firstCall.calledWith({
          name: 'tripStatusJob',
          'data.tripId': tripId,
        })
      ).to.be.true;
      expect(
        agendaCancelStub.secondCall.calledWith({
          name: 'ticketStatusJob',
          'data.tripId': tripId,
        })
      ).to.be.true;
    });

    it('should throw an error when agenda.cancel fails', async () => {
      const tripId = 'testTripId';
      const testError = new Error('Test error');

      agendaCancelStub.rejects(testError);

      try {
        await schedulerService.cancelScheduledTime(tripId);
      } catch (error) {
        expect(error).to.equal(testError);
      }

      expect(agendaCancelStub.calledOnce).to.be.true;
    });
  });
});
