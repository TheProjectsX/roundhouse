## Context:
Currently Roundhouse usage only one APIKey for user per provider, which shouldn't be the case. As this project's whole purpose is to maximize api usage.

## Goal:
- Make it so that user can provide multiple apikeys for a singular Provider.
- The APIKeys can be active / deactivate
- Roundhouse will take the APIKey at random from apikeys of a certain provider so that the api key request can be distributed.
- Each APIKey for provider will hold how many successful requests did it passed.


## Final:
Make plans before performing.
Ask for any clarification.


## Clarifications:
- One Public RoundHouse Secret API Key can hold multiple Secret keys for a certain provider.
For example, user X can store more than one API Key for OpenAI or Gemini or Anthropic
- Increase the success count after that api key is used to get a successful response from provider.
For example, for OpenAI, apikey1 ran after roundhouse but failed, in next iteration apikey2 succeeded, so the success count for apikey1 stays same but apikey2 increases.

NOTE: Have the DB requests which does not concern the API Call flow in the background so that the API request does not take too long.