Services and utilities already created, just need the final connection.

## Endpoints
We will need implementations of these API Paths:
* `POST /v1/chat/completions`
* `POST /v1/responses`
* `GET /v1/models`


## Endpoint Rules:
Endpoints will follow OpenAI Request-Response model. For Success AND Error, both will follow OpenAI Request-Response Model.
There will be some additional headers for Roundhouse Usage:
- `X-Provider`: This can be just a provider name: "gemini"
 - Use only that provider for roundhouse.
- `X-Models`: This will be model list with providers prefix: "gemini/gemini-3-flash-preview,gemini/gemini-2.5-flash"
 - Use only those provided models, select provider by .split("/")[0]
- `X-Max-Iterations`: Maximum roundhouse iterations for model execution

The `/v1/models` will take apiKey. Can be given from:
 - params : `/v1/models?apiKey=.....`
 - in header: `X-API-Key = .....`
 - as Bearer authorization: `Authorization: Bearer .....`

The routes will take exactly the things that OpenAI Request payload and headers would take and use them to run the service.


## Flow:
User Request call -> Validate using ZOD -> get the Body -> run roundhouse with executor created and other things that needs to run -> Format Success Response (Maybe already done) and Error (Maybe need to do) compatible with OpenAI response -> Return

Plan your execution first. Check if any other service / utils / files needs to change / update. If does, asks first if you should change the updates or not. After full confirmation, go on with the updates. Use utilities / middlewares where possible.