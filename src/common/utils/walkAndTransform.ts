/* eslint-disable @typescript-eslint/no-explicit-any */

import { wrapFilename } from "./url_wrappers";

type AnyObj = { [key: string]: any };

export const walkAndTransform = (
    input: AnyObj | AnyObj[],
    keys: string | string[],
): AnyObj | AnyObj[] => {
    if (!input) return input;

    const keySet = new Set(Array.isArray(keys) ? keys : [keys]);

    const handle = (value: any): any => {
        if (Array.isArray(value)) {
            return value.map(handle);
        }

        if (
            value &&
            typeof value === "object" &&
            Object.keys(value).length > 0
        ) {
            const result: AnyObj = {};

            for (const k in value) {
                if (keySet.has(k)) {
                    result[k] = wrapFilename(value[k]);
                } else {
                    result[k] = handle(value[k]);
                }
            }

            return result;
        }

        return value;
    };

    return handle(input);
};
