# Goal:
Refactor the codebase to follow the instructions below. Use step by step plan, read all the files for that plan, execute plan, write code, mark as done.


1: In places where QueryBuilder have been used, when query builder is beings initialized, pass 2 type with it. So, if my target model is user, the QueryBuilder will be:
``` ts
const queryBuilder = new QueryBuilder<typeof this.prisma.user, Prisma.$UserPayload>(this.prisma.user, query)
```

2: Format all the responses so that they don't just return get results from server.
* `POST` + `PATCH` + `DELETE`: will only return the `id` of the target:
``` ts
data: {
    id: string
}
```
* `POST` | `PATCH` (Update): The payload fix will be done by DTO, so use them directly unless there is any explicit dynamic changes needed
*`GET` ALL: will be formatted with it's connected data and remove useless options. Such as X includes Y, I don't need XId saved in Y nor YId saved in X model.




## Targeted Fixes:
- `/apikeys` - `GET` ALL - Return API Key's data with some little statistics of how many provider, how many models, how much model tokens used - type of things.
- `/apikeys/:id` - `GET` - Get the Api Key details as well as the provider selections, model selections, everything connected to it.

- `/providers` - `GET` ALL - Return providers with models count, active models count, how many api has connected that provider count. Exclude things useless for frontend
- `/providers/:id` - `GET` - Format the get single. Include all it's models, but not things that isn't needed.
-- simplify the `/providers` route to not use abstract functions to use when working, as there are global provider _and_ custom providers.
-- If you have to use any utility, create `*.utils.ts` and put them there, not as private functions, unless necessary and single use.

-- transfer the `custom` providers controls to `profile` module under `/profile/providers`. Though the Fetch All for admin will handle both custom and global together. 
-- Transform `profile` module to `me` module

- `/admin` - Remove "admin-" prefix from admin module's filenames and add `Roles("ADMIN")` Guard in modular level.



## Global Prefixes
- There shouldn't be any `setGlobalPrefix` in the codebase.
- `openai` module will be `/v1/....`
- Current `modules` except `openai` should go under `/api/iv-1`
- In not-so-distant future, we will also add another group of api `/api/ev-1`

If possible to group these in folders  w/o breaking changes and breaking modular NestJS structure, group them.


## Swagger
- Use swagger decorators to decorates the routes perfectly, but no need too much usage.