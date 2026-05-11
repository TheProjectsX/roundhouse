# Goal - Providers & Models structure V2

Currently the Providers and Models have deep nested connections. Thus, if a User wants to insert a new model in a already created provider, they can't. So, we will make it so that the User and Admin can add Provider and Models freely.

## New Provider model :

```prisma
model Provider {
    id String @id @default(auto()) @map("_id") @db.ObjectId

    name        String
    code         String  @unique
    description String?

    baseApi String

    free Boolean      @default(false)
    type ProviderType @default(OPENAI)

    status ContentStatus @default(ACTIVE)

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@map("providers")
}

```

## New Model model:

```prisma
model Model {
    id String @id @default(auto()) @map("_id") @db.ObjectId

    name               String
    code               String
    maxTokens          Int?
    tokenResetInterval Int? // In Minutes
    provider            String // Provider Code

    efficiencyScore Float? // 0.0 - 1.0, where 1.0 is most efficient
    bestFor         String[]
    thinking        Boolean @default(false)

    status ContentStatus @default(ACTIVE)

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@unique([code, provider])
    @@map("models")
}
```

## New User Provider model:

_Same as `Provider`_ - just connected with user

## New User Model model:

_Same as `Model`_ - just connected with user

## Provider Selection model:

```prisma
model ProviderSelection {
    id String @id @default(auto()) @map("_id") @db.ObjectId

    apiKeyId String @db.ObjectId
    apiKey   ApiKey @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)

    providerId String? @db.ObjectId
    provider Provider?

    userProviderId String? @db.ObjectId
    userProvider UserProvider?


    modelIds String[] @db.ObjectId
    models Model[] @relation(..........)

    userModelIds String[] @db.ObjectId
    userModels UserModel[] @relation(..........)

    userId String @db.ObjectId
    user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

    apiKeys ProviderApiKey[]

    active Boolean @default(true)

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@map("user__provider_selections")
}
```

## Plan:

- The Admin added Providers will be Global. So:
    - It will be connected with models via `code` and `provider`
    - Users can add mode `Models` of Global Providers like this
- Users can create their own Provider. So:
    - They can add `UserModels` with `code` and `provider` connection
- We are trying to remove the db connection limitations

## Changes in roundhouse:
- Currently the model selections were not working as they were connected. We are removing that limitation by making the Providers and Models free


## Flow:
- User Sends Request
- Take given API Key and fetch All Models
- If model selection provided via `model` property in body or `X-Models` (Same structure as current), fetch only those models
- Check `status` of models
- Get the models and go on with the rest of flow


## API Flow:
- `/providers`, `/admin/provider` and `/me/providers` will have some changes.
- when provider GET OR model GET called, the GET will take the `code` of the provider and extract all the Model with the `provider`.
    - For `/provider`, merge the User Provider and Models too and add indicator that it is global provider / model or custom
- When adding model for provider, the request will be same, just internally it will get the provider and connect with model via `code`.


## NEW:
Add `x-roundhouse-method` optional header with value of "random" and "efficiency".
Based on the type, change the roundhouse model selection. By default it is "efficiency" (Current)

## Final:
- Check prisma model connections.
- Try to use less complexity and abstractions. Devs should be able to understand the code
- Roundhouse will only change in getting the models and providers, and the new header control
- Remove any unused utils or codes
- Plan before execution


<!-- ----------- NEW ----------- -->
## Goal:
Currently our project uses the term "roundhouse type" everywhere for defining roundhouse method. In prisma, headers, internally, everywhere.
Your goal is to migrate everywhere, where it is using "roundhouse type" term and use "roundhouse method" term.

So:
- RoundhouseType -> RoundhouseMethod
- "x-roundhouse-type" -> "x-roundhouse-method"
etc