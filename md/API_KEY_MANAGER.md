## Goal:

Creating separate API Key manager for User.

## Plan:
- Create new mongo model:
```prisma
model ApiKeysManager {
    id String @id @default(auto()) @map("_id") @db.ObjectId

    name String
    provider String?
    key String

    active Boolean @default(true)

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@map("user__apikeys_managers")
}
```
- Create submodule `apikeys-manager`
- Create CRUD routes:
    - `/me/apikeys` [GET, POST, PATCH, DELETE]
