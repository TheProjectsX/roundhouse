1: In places where QueryBuilder have been used, when query builder is beings initialized, pass 2 type with it. So, if my target model is user, the QueryBuilder will be:
``` ts
const queryBuilder = new QueryBuilder<typeof this.prisma.user, Prisma.$UserPayload>(this.prisma.user, query)
```

2: Format all the responses so that they don't just return get results from server.
`POST` + `PATCH` + `DELETE`: will only return the `id` of the target:
``` ts
data: {
    id: string
}
```
`GET` ALL: will be formatted with it's connected data and remove useless options. Such as X includes Y, I don't need XId saved in Y nor YId saved in X model.




## Targeted Fixes:
- `/apikeys` - `GET` ALL - Return API Key's data with some little statistics of how many provider, how many models, how much model tokens used - type of things.
- `/apikeys/:id` - `GET` - Get the Api Key details as well as the provider selections, model selections, everything connected to it.