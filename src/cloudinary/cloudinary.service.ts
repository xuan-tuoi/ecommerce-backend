/* eslint-disable @typescript-eslint/no-var-requires */
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary-response';
const streamifier = require('streamifier');
import { ConfigService } from '@nestjs/config';
import { getImgName } from 'src/common/utils/helpers';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.get('CLOUDINARY_API_KEY'),
      api_secret: configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(
    idShop: string,
    file: Express.Multer.File,
  ): Promise<CloudinaryResponse> {
    try {
      return new Promise<CloudinaryResponse>(async (resolve, reject) => {
        // const publicId = `ecommerce/${idShop}/${getImgName(file.originalname)}`;
        const publicId = `ecommerce/${idShop}/${file.originalname}`;
        const uploadStream = await cloudinary.uploader.upload_stream(
          { public_id: publicId }, //
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        );

        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
    } catch (error) {
      console.log('error', error);
      throw new Error(error);
    }
  }

  async uploadImageFromBase64(
    folderName: string,
    base64ImageData: string,
  ): Promise<CloudinaryResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        base64ImageData,
        { folder: folderName },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
    });
  }
}
