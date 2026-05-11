import fs from "fs";
import path from "path";

export const deleteFile = async (filename: string, uploadPath = "uploads") => {
    try {
        const fullPath = path.join(process.cwd(), uploadPath, filename);

        await fs.promises.access(fullPath);
        await fs.promises.unlink(fullPath);
    } catch (error) {
        console.error(`Failed to delete file: ${filename}`, error);
    }
};

export const deleteFileFromUrl = async (
    url: string,
    uploadPath = "uploads",
) => {
    const filename = path.basename(new URL(url).pathname);

    return await deleteFile(filename, uploadPath);
};
