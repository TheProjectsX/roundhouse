import {
    FileFieldsInterceptor,
    FileInterceptor,
} from "@nestjs/platform-express";
import { diskStorage } from "multer";
import path from "path";
import { nanoid } from "nanoid";
import { existsSync, mkdirSync } from "fs";
import { slugify } from "@/common/utils/slugify";

const formatFilename = (filename: string) => {
    const uniqueSuffix = `${nanoid()}-${Date.now()}`;
    const fileExtension = path.extname(filename);

    const sluggedName = slugify(path.basename(filename, fileExtension));

    const formatted = `${sluggedName}__SUF_${uniqueSuffix}${fileExtension}`;
    return formatted;
};

export const CustomFileFieldsInterceptor = (
    fields: { name: string; maxCount?: number }[],
    uploadPath: string = "uploads",
) => {
    // Ensure the uploadPath exists
    if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true }); // Create it recursively
    }

    return FileFieldsInterceptor(fields, {
        storage: diskStorage({
            destination: (req, file, callback) => {
                callback(null, uploadPath);
            },

            filename: (req, file, callback) => {
                callback(null, formatFilename(file.originalname));
            },
        }),
    });
};

export const CustomFileInterceptor = (
    fieldName: string,
    uploadPath: string = "uploads",
) => {
    // Ensure the uploadPath exists
    if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true }); // Create it recursively
    }

    return FileInterceptor(fieldName, {
        storage: diskStorage({
            destination: (req, file, callback) => {
                callback(null, uploadPath);
            },
            filename: (req, file, callback) => {
                callback(null, formatFilename(file.originalname));
            },
        }),
    });
};
