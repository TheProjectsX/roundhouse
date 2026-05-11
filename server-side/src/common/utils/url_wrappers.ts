import config from "@/config";

// Check if string is already a URL
const isUrl = (str: string) => {
    return str.startsWith("http://") || str.startsWith("https://");
};

// Wrap filename with Uploads
export const wrapFilename = (
    filename: string | string[] | undefined,
    key: "uploads" | "stream" = "uploads",
) => {
    if (!filename) return filename;

    let filenames: string[] = [];

    if (Array.isArray(filename)) {
        filenames = filename;
    } else {
        filenames = [filename];
    }

    const wrapped = filenames.map((filename) => {
        if (isUrl(filename)) return filename;

        const wrapped = `${key === "uploads" ? config.url.uploads : config.url.stream}/${filename}`;
        return wrapped;
    });

    if (Array.isArray(filename)) {
        return wrapped;
    } else {
        return wrapped[0];
    }
};

// Unwrap Filenames to Uploads
export const unwrapFilename = (
    url: string | string[] | undefined,
): string | string[] | undefined => {
    if (!url) return url;

    let urls: string[] = [];
    if (Array.isArray(url)) {
        urls = url;
    } else {
        urls = [url];
    }

    const unwrapped = urls.map((url) => {
        if (isUrl(url)) return url;

        const parts = url.split("/");
        return parts[parts.length - 1];
    });

    if (Array.isArray(url)) {
        return unwrapped;
    } else {
        return unwrapped[0];
    }
};
