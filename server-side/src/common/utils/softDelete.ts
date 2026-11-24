export const notDeletedWhere = () => ({
    OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
});

export const deletedOnlyWhere = () => ({
    AND: [{ deletedAt: { isSet: true } }, { deletedAt: { not: null } }],
});

export const isSoftDeleted = (
    record: { deletedAt?: Date | null } | null | undefined,
): boolean => Boolean(record?.deletedAt);
