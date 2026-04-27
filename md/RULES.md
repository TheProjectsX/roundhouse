## RoundHouse Rules:

- Each API Key has:
    - Last Errors (Error models prior to a `success`), which will contain the last error `model selection`
- When fetching providers and models, exclude the model which's `model selection` is last error for that Api Key
- Based on the priority (e.g. `efficiencyScore`) a model will be chosen
- If the model gives `false` response
    - The model will be inserted as LastError per that ApiKey
    - The roundhouse will be reshuffled and start from step 1
- If the model gives `true` response
    - Remove all the LasError for that apiKey
    - Return the response

- Ignore `model` if `maxTokens` exists and `usedTokens` exceeds it

### Flow:

Request[APIKey | BODY] -> DB[Model `ApiKey` WHERE key == APIKey] => ApiKey = `ApiKey` WITH `LastErrors` + `ProviderSelections[WHERE active=True][ Providers + UserProviders + ModelSelections[WHERE active=True][ (Models + UserModels) WHERE usedTokens < (Models + UserModels)[maxTokens] ] ]` -> CHOOSE `Model` WHERE `Model` NOT IN `LastErrors` -> ROUNDHOUSE -> LOOP[ SEND REQUEST -> [ ERROR: INSERT `LastErrors` IN DB && IN FUNC STATE ] | [ SUCCESS: DELETE ALL `LastErrors`[WHERE `APIKey` MATCH] ; BREAK ] ] -> RETURN RESPONSE

== ROUNDHOUSE:
Select based on `efficiencyScore` > . If no `efficiencyScore` ASSUME 0.5

