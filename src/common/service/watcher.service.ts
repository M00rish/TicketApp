import mongooseService from './mongoose.service';
import debug from 'debug';

const log: debug.IDebugger = debug('app:watcher-service');

class watcherService {
  //   private DB = mongooseService.getMongoose().connection;
  //   watchTripUpdates() {
  //     try {
  //       log('watching trip updates');
  //       const collection = mongooseService
  //         .getMongoose()
  //         .connection.collection('trips');
  //       const tripwatcher = collection.watch();
  //       tripwatcher.on('change', (change) => {
  //         if (change.operationType === 'update') {
  //           log('change:' + change);
  //           // const { status } = change.updateDescription.updatedFields;
  //           // if (status === 'completed') {
  //           //   log('Trip status updated to completed:' + change.documentKey._id);
  //           // }
  //         }
  //       });
  //     } catch (error) {
  //       log(error);
  //     }
  //   }
}

// export default new watcherService();
