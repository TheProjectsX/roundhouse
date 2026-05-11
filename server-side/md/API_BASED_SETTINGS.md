## Goal: Add API based settings.

Currently the project uses `headers` to implement things like "max iteration count", "roundhouse type". But they now will come from database, record of that api key.

## Schema Update:

```prisma
model ApiKey {
    ...

    maxIterations Int @default(3)
    roundhouseMethod RoundhouseMethod @default(EFFICIENCY)

    createdAt ....
}


// ...
enum RoundhouseMethod {
    RANDOM
    EFFICIENCY
}

```

## Work:

- Create ApiKey settings update routes
- Take these from the ApiKey's settings.
- If they are given in headers too (`x-max-iterations` | `x-roundhouse-method`), the headers will have the priority.
