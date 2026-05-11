// import { Injectable } from "@nestjs/common";
// import { ConfigService } from "@nestjs/config";
// import { v2 as cloudinary } from "cloudinary";
// import {
//     S3Client,
//     PutObjectCommand,
//     DeleteObjectCommand,
// } from "@aws-sdk/client-s3";
// import * as fs from "fs-extra";
// import { nanoid } from "nanoid";

// @Injectable()
// export class FileService {
//     private s3Client: S3Client;

//     constructor(private configService: ConfigService) {
//         cloudinary.config({
//             cloud_name: this.configService.get("CLOUDINARY_CLOUD_NAME"),
//             api_key: this.configService.get("CLOUDINARY_API_KEY"),
//             api_secret: this.configService.get("CLOUDINARY_API_SECRET"),
//         });

//         this.s3Client = new S3Client({
//             region: "us-east-1",
//             endpoint: this.configService.get("DO_SPACE_ENDPOINT"),
//             credentials: {
//                 accessKeyId: this.configService.get("DO_SPACE_ACCESS_KEY"),
//                 secretAccessKey: this.configService.get("DO_SPACE_SECRET_KEY"),
//             },
//         });
//     }

//     /**
//      * Uploads a single file to Cloudinary and returns its URL.
//      */
//     async uploadToCloudinary(file: Express.Multer.File): Promise<string> {
//         try {
//             const result = await new Promise((resolve, reject) => {
//                 cloudinary.uploader.upload(file.path, (error, result) => {
//                     if (error) reject(error);
//                     else resolve(result);
//                 });
//             });
//             await fs.unlink(file.path); // Clean up temp file
//             return (result as { secure_url: string }).secure_url;
//         } catch (error) {
//             await fs.unlink(file.path).catch(() => {});
//             throw error;
//         }
//     }

//     /**
//      * Uploads multiple files to Cloudinary and returns their URLs.
//      */
//     async uploadMultipleToCloudinary(
//         files: Express.Multer.File[],
//     ): Promise<string[]> {
//         try {
//             const uploadPromises = files.map((file) =>
//                 this.uploadToCloudinary(file),
//             );
//             return await Promise.all(uploadPromises);
//         } catch (error) {
//             throw error;
//         }
//     }

//     async deleteFromCloudinary(url: string): Promise<void> {
//         const publicId = decodeURIComponent(url).split("/").pop().split(".")[0];
//         await new Promise((resolve, reject) => {
//             cloudinary.uploader.destroy(publicId, (error, result) => {
//                 if (error) reject(error);
//                 else resolve(result);
//             });
//         });
//     }

//     /**
//      * Deletes multiple files from Cloudinary.
//      */
//     async deleteMultipleFromCloudinary(urls: string[]): Promise<void> {
//         try {
//             const deletePromises = urls.map((url) =>
//                 this.deleteFromCloudinary(url),
//             );
//             await Promise.all(deletePromises);
//         } catch (error) {
//             throw new Error(
//                 `Failed to delete files from Cloudinary: ${error.message}`,
//             );
//         }
//     }

//     async uploadToDigitalOcean(file: Express.Multer.File): Promise<string> {
//         try {
//             const fileStream = fs.createReadStream(file.path);
//             const key = `${nanoid()}-${file.originalname}`;
//             const bucket = this.configService.get("DO_SPACE_BUCKET");
//             await this.s3Client.send(
//                 new PutObjectCommand({
//                     Bucket: bucket,
//                     Key: key,
//                     Body: fileStream,
//                     ACL: "public-read",
//                     ContentType: file.mimetype,
//                 }),
//             );
//             // `${config.aws.do_space_endpoint}/${config.aws.do_space_bucket}/${key}`;
//             const location = `${this.configService.get("DO_SPACE_ENDPOINT")}/${bucket}/${key}`;
//             await fs.unlink(file.path);
//             return location;
//         } catch (error) {
//             await fs.unlink(file.path).catch(() => {});
//             throw error;
//         }
//     }

//     /**
//      * Uploads multiple files to DigitalOcean Spaces and returns their URLs.
//      */
//     async uploadMultipleToDigitalOcean(
//         files: Express.Multer.File[],
//     ): Promise<string[]> {
//         try {
//             const uploadPromises = files.map((file) =>
//                 this.uploadToDigitalOcean(file),
//             );
//             return await Promise.all(uploadPromises);
//         } catch (error) {
//             throw error;
//         }
//     }

//     async deleteFromDigitalOcean(url: string): Promise<void> {
//         const bucket = this.configService.get("DO_SPACE_BUCKET");
//         const parsedUrl = new URL(url);
//         const key = parsedUrl.pathname.replace(`/${bucket}/`, "");

//         await this.s3Client.send(
//             new DeleteObjectCommand({
//                 Bucket: bucket,
//                 Key: key,
//             }),
//         );
//     }

//     /**
//      * Deletes multiple files from DigitalOcean Spaces.
//      */
//     async deleteMultipleFromDigitalOcean(urls: string[]): Promise<void> {
//         try {
//             const deletePromises = urls.map((url) =>
//                 this.deleteFromDigitalOcean(url),
//             );
//             await Promise.all(deletePromises);
//         } catch (error) {
//             throw new Error(
//                 `Failed to delete files from DigitalOcean: ${error.message}`,
//             );
//         }
//     }
// }
