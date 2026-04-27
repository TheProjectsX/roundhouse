/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-object-type */

/**
 * QueryBuilder - Version 2.0
 *
 * DESCRIPTION::
 * Full Type Safety
 * Uses Prisma Generated types to Show correct auto complete and types
 * Returns the final Included, Selected, Omitted value
 * By Default doesn't require Type Input, but still shows suggestions.
 *    But If Returned value's type is also required, then Type of the passed model and Payload of the model is required
 *    Explanation can be found on the `constructor`
 */

import { GetResult, OperationPayload } from "@prisma/client/runtime/library";

// Helper to check if a type is an enum
type IsEnum<T> = T extends string | number
    ? string extends T
        ? false
        : number extends T
          ? false
          : true
    : false;

type EnumKeys<T> = {
    [K in keyof T]: IsEnum<T[K]> extends true ? K : never;
}[keyof T];

// Helper to check if a type is boolean
type IsBoolean<T> = T extends boolean
    ? boolean extends T
        ? false
        : true
    : false;

type BooleanKeys<T> = {
    [K in keyof T]: IsBoolean<T[K]> extends true ? K : never;
}[keyof T];

type DateKeys<T> = {
    [K in keyof T]: T[K] extends Date ? K : never;
}[keyof T];

type CleanOptions<TInclude, TSelect, TOmit> = (TInclude extends undefined
    ? {}
    : { include: TInclude }) &
    (TSelect extends undefined ? {} : { select: TSelect }) &
    (TOmit extends undefined ? {} : { omit: TOmit });

type JoinRecords<O, N> = (O extends undefined ? {} : O) & N;

type ExtractField<TArgs, K extends keyof any> = [
    Exclude<TArgs, undefined>,
] extends [{ [P in K]?: infer S }]
    ? S
    : Record<string, any>;

type WithString<T> = Array<Exclude<T, T[] | undefined> | (string & {})>;

class QueryBuilder<
    Model extends { findMany: (...args: any) => any },
    TPayload,
    TFindManyArgs = NonNullable<Parameters<Model["findMany"]>[0]>,
    TInclude = undefined,
    TSelect = undefined,
    TOmit = undefined,
> {
    private model: any;
    private query: Record<string, unknown>;
    private prismaQuery: Partial<TFindManyArgs> | any = {};

    /**
     * @template Model (optional) - Type of the Model you are passing (e.g., `typeof prisma.user`) - Only pass if passing TPayload
     * @template TPayload (optional) - The Prisma Payload type for the model (e.g., `Prisma.$UserPayload`) - Only pass if you need typing for returned fields
     * @param model - The Prisma model client (e.g., prisma.user)
     * @param query - The raw query object
     *
     *
     * ``` ts
     * // If Type of returned valued from `execute` isn't Needed
     * const queryBuilder = new QueryBuilder(prisma.user, query)
     *
     * // If Type of returned valued from `execute` is Needed
     * const queryBuilder = new QueryBuilder<typeof prisma.user, Prisma.$UserPayload>(prisma.user, query)
     * //`typeof prisma.user` -> same for every model
     * //`Prisma.$UserPayload` -> Just replace the $UserPayload with $ModelNamePayload -> where ModelName is capitalized
     * ```
     */
    constructor(model: Model, query: Record<string, unknown>) {
        this.model = model;
        this.query = query;
    }
    /**
     * Adds OR search conditions for specified fields using query.search.
     *
     * Supports nested fields: `["name", "clinic.name"]`
     */
    search(
        fields: TFindManyArgs extends { distinct?: infer T }
            ? WithString<T>
            : string[],
    ) {
        const search = this.query.search as string;
        if (!search) return this;

        this.prismaQuery.where = {
            ...this.prismaQuery.where,
            OR: (fields as string[]).map((field) => {
                const parts = field.split("."); // split nested path
                return parts.reduceRight<any>((acc, key, index) => {
                    if (index === parts.length - 1) {
                        // last part = the actual field
                        return {
                            [key]: {
                                contains: search,
                                mode: "insensitive",
                            },
                        };
                    }
                    return { [key]: acc }; // wrap previous level
                }, {});
            }),
        };

        return this;
    }

    /**
     * Applies filter conditions for query fields.
     * Supports "null", "notnull", exact fields, and contains search.
     *
     * Can filter by nested exact fields e.g. ENUMs : `{ exacts: ["role", "client.status"] }`
     * Can filter by nested boolean: `{ exacts: ["verified", "profile.deleted"] }`
     */
    filter({
        exacts = [],
        booleans = [],
        exclude = [],
    }: {
        exacts?: (
            | EnumKeys<Awaited<ReturnType<Model["findMany"]>>[0]>
            | (string & {})
        )[];
        booleans?: (
            | BooleanKeys<Awaited<ReturnType<Model["findMany"]>>[0]>
            | (string & {})
        )[];
        exclude?: string[];
    } = {}) {
        const queryObj = { ...this.query };
        const excludeFields = [
            "search",
            "sort",
            "limit",
            "page",
            "fields",
            "populate",
            "dateRange",
            ...exclude,
        ];
        excludeFields.forEach((field) => delete queryObj[field]);

        const formattedFilters: Record<string, any> = {};

        for (const [field, value] of Object.entries(queryObj)) {
            if (value === "null") {
                formattedFilters[field] = null;
            } else if (value === "notnull") {
                formattedFilters[field] = { not: null };
            } else if ((exacts as string[]).includes(field)) {
                const parts = field.split(".");
                const nestedFilter = parts.reduceRight<any>(
                    (acc, key, index) => {
                        if (index === parts.length - 1) {
                            return { [key]: { equals: value } };
                        }
                        return { [key]: acc };
                    },
                    {},
                );
                Object.assign(formattedFilters, nestedFilter);
            } else if ((booleans as string[]).includes(field)) {
                const parts = field.split(".");
                const nestedFilter = parts.reduceRight<any>(
                    (acc, key, index) => {
                        if (index === parts.length - 1) {
                            return { [key]: value === "false" ? false : true };
                        }
                        return { [key]: acc };
                    },
                    {},
                );
                Object.assign(formattedFilters, nestedFilter);
            } else {
                formattedFilters[field] = {
                    contains: value,
                    mode: "insensitive",
                };
            }
        }

        this.prismaQuery.where = {
            ...this.prismaQuery.where,
            ...formattedFilters,
        };

        return this;
    }

    /**
     * Merges raw arguments into prismaQuery.
     * Special handling for 'where' to merge AND/OR conditions safely.
     */
    rawArgs(args: Partial<TFindManyArgs>) {
        Object.entries(args).forEach(([key, value]) => {
            if (key === "where" && value) {
                const whereValue = value as any;
                this.prismaQuery.where = {
                    ...(this.prismaQuery.where ?? {}),
                    ...whereValue,
                    AND: [
                        ...(this.prismaQuery.where?.AND ?? []),
                        ...(whereValue.AND
                            ? Array.isArray(whereValue.AND)
                                ? whereValue.AND
                                : [whereValue.AND]
                            : []),
                    ],
                    OR: [
                        ...(this.prismaQuery.where?.OR ?? []),
                        ...(whereValue.OR
                            ? Array.isArray(whereValue.OR)
                                ? whereValue.OR
                                : [whereValue.OR]
                            : []),
                    ],
                };
            } else if (
                value &&
                typeof value === "object" &&
                !Array.isArray(value)
            ) {
                this.prismaQuery[key] = {
                    ...(this.prismaQuery[key] ?? {}),
                    ...value,
                };
            } else {
                this.prismaQuery[key] = value;
            }
        });

        return this;
    }

    /**
     * Adds raw filters to 'where'.
     * Safely merges AND/OR with existing where conditions.
     */
    rawFilter(
        filters: TFindManyArgs extends { where?: infer W }
            ? NonNullable<W>
            : Record<string, any>,
    ) {
        const where = this.prismaQuery.where ?? {};
        const newWhere = {
            ...where,
            ...filters!,
            AND: [
                ...(where.AND ?? []),
                ...((filters as any).AND
                    ? Array.isArray((filters as any).AND)
                        ? (filters as any).AND
                        : [(filters as any).AND]
                    : []),
            ],
            OR: [
                ...(where.OR ?? []),
                ...((filters as any).OR
                    ? Array.isArray((filters as any).OR)
                        ? (filters as any).OR
                        : [(filters as any).OR]
                    : []),
            ],
        };
        this.prismaQuery.where = newWhere;
        return this;
    }

    /**
     * Applies range filters to specified fields using query values.
     *
     * Supports nested fields using "." notation (e.g., "user.createdAt").
     * Automatically casts query values based on the specified type.
     * Merges multiple filters into the Prisma `OR` condition.
     *
     * Handles types: "date", "number", or "string" for proper casting.
     */

    range(
        filters: {
            field: TFindManyArgs extends { distinct?: infer T }
                ? T | (string & {})
                : string;
            startKey: string;
            endKey: string;
            type: "date" | "number" | "string";
        }[],
    ) {
        filters.forEach(({ field, startKey, endKey, type }) => {
            let minValue = this.query[startKey];
            let maxValue = this.query[endKey];

            if (minValue === undefined && maxValue === undefined) return;

            // Cast values based on type
            if (type === "date") {
                if (minValue) minValue = new Date(minValue as string);
                if (maxValue) maxValue = new Date(maxValue as string);
            } else if (type === "number") {
                if (minValue) minValue = Number(minValue);
                if (maxValue) maxValue = Number(maxValue);
            }

            const rangeCondition: Record<string, any> = {};
            if (minValue !== undefined) rangeCondition.gte = minValue;
            if (maxValue !== undefined) rangeCondition.lte = maxValue;

            // Handle nested fields using "." splitter
            const pathSegments = (field as string).split(".");
            const nestedCondition = pathSegments.reduceRight<
                Record<string, any>
            >((acc, key, index) => {
                return index === pathSegments.length - 1
                    ? { [key]: rangeCondition }
                    : { [key]: acc };
            }, {});

            // Merge with existing OR conditions
            const existingOr = this.prismaQuery.where?.OR || [];
            this.prismaQuery.where = {
                ...this.prismaQuery.where,
                OR: [...existingOr, nestedCondition],
            };
        });

        return this;
    }

    /**
     * Uses the convenient startDate - endDate method to use range. requires to pass fields
     * Takes date object from query's startDate and endDate
     * If only either is passed, query is being created based on that
     */
    rangeDate(
        fields: (
            | DateKeys<Awaited<ReturnType<Model["findMany"]>>[0]>
            | (string & {})
        )[],
    ) {
        const { startDate, endDate } = this.query as {
            startDate?: string;
            endDate?: string;
        };

        const rangeQuery: Partial<{ gte: Date; lte: Date }> = {};
        if (startDate) rangeQuery.gte = new Date(startDate);
        if (endDate) rangeQuery.lte = new Date(endDate);

        if (!startDate && !endDate) return this;

        const stringFields = fields as readonly string[];

        this.prismaQuery.where = {
            ...this.prismaQuery.where,
            OR: stringFields.map((field) => {
                const parts = field.split(".");
                return parts.reduceRight(
                    (acc, key, index) => {
                        return index === parts.length - 1
                            ? { [key]: rangeQuery }
                            : { [key]: acc };
                    },
                    {} as Record<string, any>,
                );
            }),
        };

        return this;
    }

    /**
     * Applies sorting from query.order string.
     * Supports "-" prefix for descending order.
     */
    sort() {
        const sort = (this.query.order as string)?.split(",") || ["-createdAt"];
        const orderBy = sort.map((field) => {
            if (field.startsWith("-")) {
                return { [field.slice(1)]: "desc" };
            }
            return { [field]: "asc" };
        });

        this.prismaQuery.orderBy = orderBy;
        return this;
    }

    /**
     * Applies custom sort fields.
     * Accepts single object or array of Prisma orderBy objects.
     */
    sortBy(
        fields: TFindManyArgs extends { orderBy?: infer T }
            ? T
            : Record<string, "asc" | "desc"> | Record<string, "asc" | "desc">[],
    ) {
        const existing = Array.isArray(this.prismaQuery.orderBy)
            ? this.prismaQuery.orderBy
            : this.prismaQuery.orderBy
              ? [this.prismaQuery.orderBy]
              : [];
        const newFields = Array.isArray(fields) ? fields : [fields];
        this.prismaQuery.orderBy = [...existing, ...newFields];
        return this;
    }

    /**
     * Applies pagination based on query.page and query.limit.
     */
    paginate() {
        const page = Number(this.query.page) || 1;
        const limit = Number(this.query.limit) || 10;
        const skip = (page - 1) * limit;

        this.prismaQuery.skip = skip;
        this.prismaQuery.take = limit;

        return this;
    }

    /**
     * Selects fields from query.fields string.
     */
    fields() {
        const fields = (this.query.fields as string)?.split(",") || [];
        if (fields.length > 0) {
            this.prismaQuery.select = fields.reduce(
                (acc: Record<string, boolean>, field) => {
                    acc[field] = true;
                    return acc;
                },
                {},
            );
        }
        return this;
    }

    /**
     * Adds Prisma include fields to query.
     */
    include<T extends ExtractField<TFindManyArgs, "include">>(
        fields: T,
    ): [TSelect] extends [undefined]
        ? QueryBuilder<
              Model,
              TPayload,
              TFindManyArgs,
              JoinRecords<TInclude, T>,
              TSelect,
              TOmit
          >
        : "Please either choose `select` or `include`" {
        this.prismaQuery.include = {
            ...this.prismaQuery.include,
            ...(fields as Record<string, unknown>),
        };
        return this as any;
    }

    /**
     * Adds Prisma select fields to query.
     */
    select<T extends ExtractField<TFindManyArgs, "select">>(
        fields: T,
    ): [TInclude] extends [undefined]
        ? [TOmit] extends [undefined]
            ? QueryBuilder<
                  Model,
                  TPayload,
                  TFindManyArgs,
                  TInclude,
                  JoinRecords<TSelect, T>,
                  TOmit
              >
            : "Please either choose `select` or `omit`"
        : "Please either choose `select` or `include`" {
        this.prismaQuery.select = {
            ...this.prismaQuery.select,
            ...(fields as Record<string, unknown>),
        };
        return this as any;
    }

    /**
     * Adds Prisma omit fields to query.
     */
    omit<T extends ExtractField<TFindManyArgs, "omit">>(
        fields: T,
    ): [TSelect] extends [undefined]
        ? QueryBuilder<
              Model,
              TPayload,
              TFindManyArgs,
              TInclude,
              TSelect,
              JoinRecords<TOmit, T>
          >
        : "Please either choose `select` or `omit`" {
        this.prismaQuery.omit = {
            ...this.prismaQuery.omit,
            ...(fields as Record<string, unknown>),
        };
        return this as any;
    }

    /**
     * Executes the Prisma findMany query with any extra options.
     */
    async execute(
        extraOptions: TFindManyArgs extends { [key: string]: any }
            ? TFindManyArgs
            : Record<string, any> = {} as any,
    ): Promise<
        TPayload extends OperationPayload
            ? GetResult<
                  TPayload,
                  CleanOptions<TInclude, TSelect, TOmit>,
                  "findMany"
              >
            : any[]
    > {
        const query = this.cleanQuery(this.prismaQuery);

        return this.model.findMany({
            ...query,
            ...extraOptions,
        });
    }

    /**
     * Returns total count, current page, limit, and total pages.
     */
    async countTotal(): Promise<{
        page: number;
        limit: number;
        total: any;
        totalPage: number;
    }> {
        const query = this.cleanQuery(this.prismaQuery);

        const total = await this.model.count({ where: query.where });
        const page = Number(this.query.page) || 1;
        const limit = Number(this.query.limit) || 10;
        const totalPage = Math.ceil(total / limit);

        return {
            page,
            limit,
            total,
            totalPage,
        };
    }

    // Utility Functions
    private cleanQuery(query: Record<string, any>) {
        if (!query.where) return query;

        const cleanedWhere = { ...query.where };

        if (Array.isArray(cleanedWhere.AND) && cleanedWhere.AND.length === 0) {
            delete cleanedWhere.AND;
        }

        if (Array.isArray(cleanedWhere.OR) && cleanedWhere.OR.length === 0) {
            delete cleanedWhere.OR;
        }

        return {
            ...query,
            where: cleanedWhere,
        };
    }
}

export default QueryBuilder;
