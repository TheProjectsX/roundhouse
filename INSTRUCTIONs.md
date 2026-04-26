## GOAL

Build an API Wrapper layer **fully compatible with OpenAI’s API surface**, while internally supporting multiple providers (OpenAI, Anthropic, Gemini, custom).

Targets:
- OpenAI API
- Gemini API
- Anthropic API
- Custom OAuth API

Context:
- Code already has OpenAI, Anthropic, Gemini providers created with Custom provider
- Under the hood, there will be multiple Providers which can independently support any of those target providers
- Input, Output, API Route, Headers all will reflect OpenAI API


#### Endpoints
We will need implementations of these API Paths:
* `POST /v1/chat/completions`
* `POST /v1/responses`
* `GET /v1/models`
Just make the call services. Routes will be defined later. But the structure will match exactly.

## Request Contract (STRICT)

Accept OpenAI-compatible body:

```json
{
  "model": "string",
  "messages": [...],
  "tools": [...],
  "tool_choice": "auto",
  "temperature": number,
  "top_p": number,
  "stream": boolean
}
```

Rules:

* DO NOT reject unknown fields → pass through if possible
* DO NOT require provider-specific fields
* Preserve request shape internally


## Response Contract (STRICT)

Always return:

```json
{
  "id": "string",
  "object": "chat.completion",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "string",
        "tool_calls": [...]
      }
    }
  ]
}
```

Rules:

* Even if provider differs → normalize to this format
* Tool calls MUST follow OpenAI schema
* No provider-specific response leakage

## 🔑 Headers

Support:

```
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

Optional custom headers (Just take, don't implement yet):

```
X-Provider: <provider_name>
X-Strict-Mode: true|false
X-Debug: true|false
```

## Normalization Layer

### Input Normalization

Convert OpenAI request → internal format:

```ts
type NormalizedRequest = {
  model: string;
  messages: Message[];
  tools?: Tool[];
  tool_choice?: string | object;
  params: Record<string, any>;
};
```


### Output Normalization

Convert provider response → OpenAI format:

* Extract text
* Extract tool calls
* Map roles
* Merge into `choices[]`

### Streaming

All providers MUST stream in OpenAI format:

```
data: { "choices": [ { "delta": { "content": "..." } } ] }
```

Adapter must translate provider stream → this format