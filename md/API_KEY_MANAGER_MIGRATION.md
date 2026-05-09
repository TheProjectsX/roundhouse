Instead of using `ProviderApiKey` model with `ApiKey`, use `ApiKeyManager` for the source of truth of ApiKeys of providers.
So, updates will be done in `/apikeys` routes, and roundhouse API Key selection. The ApiKey from the ApiKeyManager may have `active=false` too!
Ask for anything you are confused about, DO NOT guess.


Follow te flow:
- `ApiKey`[providerSelections] -> `ProviderSelection`[providerApiKeys] -> `ApiKeysManager`
- `ApiKeysManager` will have the things that `ProviderApiKey` has (successCount, lastErrors).
- `ProviderApiKey` will be gone to abyss
- `/apikeys/:id/providers/:providerId` will not take `key` and `active`, but will take the IDs of `ApiKeyManager` which will be connected to ProviderSelection
- The `ApiKeysManager` will be the source of truth for the APIKeys for providers for user's account. It will be like a Api Keys manager, where user's every used api key's will stay (Not this platform created, the third party ones)
- Other functionalities (check status, update token usage, etc) will be same as now with many connections update.