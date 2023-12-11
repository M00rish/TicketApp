import express from 'express';
import multer from 'multer';
import HttpStatusCode from '../enums/HttpStatusCode.enum';
import path from 'path';
import AppError from '../types/appError';
import debug from 'debug';

const log: debug.IDebugger = debug('app:image-update-middleware');

class imageUpdateMiddleware {
  updateImage =
    (ressource: string) =>
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      let imagesFolderPath;

      if (ressource === 'user')
        imagesFolderPath = path.join(__dirname, '../../public/users/images');
      else if (ressource === 'bus')
        imagesFolderPath = path.join(__dirname, '../../public/buses/images');

      const storage = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, imagesFolderPath);
        },
        filename: function (req, file, cb) {
          const extension = file.mimetype.split('/')[1];

          cb(null, `${file.fieldname}-${Date.now()}.${extension}`);
        },
      });

      const multerFilter = (
        req: express.Request,
        file: Express.Multer.File,
        cb: any
      ) => {
        if (file.mimetype.startsWith('image')) {
          cb(null, true);
        } else {
          const error = new AppError(
            true,
            'MULTER_ERROR',
            HttpStatusCode.BadRequest,
            'Not an image. Please upload only images.'
          );

          cb(error, false);
        }
      };

      const upload = multer({
        storage: storage,
        fileFilter: multerFilter,
      }).single('image');

      upload(req, res, function (err) {
        if (err) {
          return next(err);
        }

        req.body.image = req.file?.filename;
        next();
      });
    };
}

export default new imageUpdateMiddleware();
export { imageUpdateMiddleware };
