# OpenAI-Compatible Multi-Provider Wrapper — Implementation Spec

## 🎯 Goal

Build an API wrapper that is **fully compatible with OpenAI’s API surface**, while internally supporting multiple providers (OpenAI, Anthropic, Gemini, custom).

The wrapper MUST:

* Accept OpenAI-style requests
* Return OpenAI-style responses
* Transparently route + adapt to different providers
* Never break OpenAI contract

---

## 📡 API Surface (DO NOT CHANGE)

### Endpoints

Implement exactly:

* `POST /v1/chat/completions`
* `POST /v1/responses` (optional but recommended)
* `GET /v1/models`

No renaming. No restructuring.

---

## 📦 Request Contract (STRICT)

Accept OpenAI-compatible body:

```json
{
  "model": "string",
  "messages": [],
  "tools": [],
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

---

## 📤 Response Contract (STRICT)

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
        "tool_calls": []
      }
    }
  ]
}
```

Rules:

* Even if provider differs → normalize to this format
* Tool calls MUST follow OpenAI schema
* No provider-specific response leakage

---

## 🔑 Headers

Support:

```
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

Optional custom headers:

```
X-Provider: <provider_name>   // force provider
X-Strict-Mode: true|false    // fail on unsupported features
X-Debug: true|false          // include translated payloads
```

---

## 🧠 Core Architecture

### 1. Provider Registry

Map model → provider:

```ts
type Provider = "openai" | "anthropic" | "gemini" | "custom";

const MODEL_PROVIDER_MAP = {
  "gpt-*": "openai",
  "claude-*": "anthropic",
  "gemini-*": "gemini"
};
```

---

### 2. Capability Definition

Each provider declares capabilities:

```ts
type Capabilities = {
  tools: boolean;
  tool_choice: boolean;
  streaming: boolean;
  system_messages: boolean;
  json_mode: boolean;
};
```

---

### 3. Provider Adapter Interface

Each provider MUST implement:

```ts
interface ProviderAdapter {
  sendRequest(req: NormalizedRequest): Promise<NormalizedResponse>;
  streamRequest?(req: NormalizedRequest): AsyncIterable<StreamChunk>;
  capabilities: Capabilities;
}
```

---

## 🔄 Normalization Layer

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

---

### Output Normalization

Convert provider response → OpenAI format:

* Extract text
* Extract tool calls
* Map roles
* Merge into `choices[]`

---

## 🔧 Feature Handling Rules

### Tools

If provider supports tools:

* Map OpenAI tools → provider format

If NOT supported:

* Default: emulate via prompt injection
* Strict mode: throw error

---

### Tool Choice

If supported:

* Pass through

If NOT supported:

* `"auto"` → ignore
* `"required"` → enforce via prompt
* specific tool → bias prompt

---

### Streaming

All providers MUST stream in OpenAI format:

```
data: { "choices": [ { "delta": { "content": "..." } } ] }
```

Adapter must translate provider stream → this format

---

## ⚠️ Strict Mode Behavior

If `X-Strict-Mode: true`:

* Throw error when:

  * tools unsupported
  * tool_choice unsupported
  * streaming unsupported

Else:

* Fallback to emulation or ignore

---

## 🧩 Model Strategy

Support BOTH:

### Pass-through models

```
gpt-4o
claude-3-opus
gemini-1.5
```

### Virtual models (optional)

```
smart-small
smart-large
```

Mapped internally to real providers

---

## 🔁 Execution Flow

```
Incoming Request
    ↓
Normalize Request
    ↓
Resolve Provider (model or header)
    ↓
Load Adapter
    ↓
Check Capabilities
    ↓
Adapt Request (tools, messages, etc.)
    ↓
Send to Provider API
    ↓
Receive Response
    ↓
Normalize Response
    ↓
Return OpenAI Format
```

---

## 🚫 Hard Rules

* NEVER expose provider-specific formats
* NEVER break OpenAI schema
* NEVER require provider-specific params
* ALWAYS normalize responses
* ALWAYS support tools field (even if emulated)

---

## ✅ Success Criteria

Wrapper is correct if:

* OpenAI SDK works without modification
* Switching providers requires zero client changes
* Tools work consistently across providers
* Responses are indistinguishable from OpenAI format

---
