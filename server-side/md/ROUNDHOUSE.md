# ROUNDHOUSE Architecture

## Overview

Roundhouse is a deterministic model selection and retry system scoped per `ApiKey`.

It:

* Selects the most efficient available model
* Retries on failure with dynamic exclusion
* Avoids redundant DB reads during retries
* Guarantees termination via `maxIterations`

---

## Core Principles

1. **Single Load**

   * DB is read **once per request**
   * All retries operate on in-memory state

2. **Deterministic Selection**

   * Models are always chosen by `efficiencyScore DESC`

3. **Failure Isolation**

   * Failed `ModelSelection` is excluded per iteration

4. **Recovery Mechanism**

   * If all models are exhausted → reset exclusions

5. **Bounded Execution**

   * Hard limit via `maxIterations` (default: 5)

---

## Data Scope

### Loaded Once

```text
ApiKey
├── LastErrors[]
├── ProviderSelections (active)
    ├── Providers + UserProviders
    └── ModelSelections (active)
        ├── Models + UserModels
        └── usedTokens
```

---

## Eligibility Rules

A `ModelSelection` is valid if:

* `ProviderSelection.active = true`
* `ModelSelection.active = true`
* Model/UserModel:

  * `status = ACTIVE`
* Token constraint:

  * if `maxTokens != null` → `usedTokens < maxTokens`

---

## Scoring

```text
score = model.efficiencyScore ?? 0.5
```

---

## State (In-Memory)

```text
excluded = Set<modelSelectionId>   // starts from LastErrors
candidates = []                    // precomputed pool
iteration = 0
maxIterations = 5                 // Default with parameter input
```

---

## Preprocessing

Flatten all valid models into candidates:

```pseudo
candidates = []

for each ProviderSelection ps:
  if not ps.active: continue

  for each ModelSelection ms:
    if not ms.active: continue

    model = pickModel(ms.models, ms.userModels)

    if model.status != ACTIVE: continue

    if model.maxTokens != null AND ms.usedTokens >= model.maxTokens:
        continue

    candidates.push({
        modelSelectionId: ms.id,
        model: model,
        score: model.efficiencyScore ?? 0.5
    })
```

Sort once:

```pseudo
sort candidates by score DESC
```

---

## Roundhouse Loop

```pseudo
excluded = Set(initial LastErrors)
iteration = 0

while iteration < maxIterations:

    iteration += 1

    available = candidates.filter(c => c.modelSelectionId NOT IN excluded)

    // Exhaustion Case
    if available.empty():

        excluded.clear()
        deleteLastErrors(apiKey)

        available = candidates

        if available.empty():
            return ERROR("NO_AVAILABLE_MODELS")

    // Pick best
    candidate = available[0]

    result = sendRequest(candidate.model, payload)

    if result.success:

        deleteLastErrors(apiKey)
        return result.data

    else:

        excluded.add(candidate.modelSelectionId)
        insertLastError(apiKey, candidate.modelSelectionId)

        continue
```

---

## Termination Conditions

### Success

* Return response
* Clear all `LastErrors`

---

### Exhaustion Recovery

* If all models excluded:

  * Clear `excluded`
  * Delete `LastErrors` from DB
  * Retry from full pool

---

### Hard Stop

```text
if iteration >= maxIterations:
    return ERROR("MAX_ITERATIONS")
```

---

## Helper

```pseudo
function pickModel(models, userModels):
    return first ACTIVE from (userModels + models)
```

---

## Behavior Summary

```text
LOAD ONCE
→ BUILD POOL
→ SORT BY EFFICIENCY

LOOP:
    FILTER (exclude failed)
    IF EMPTY → RESET
    PICK BEST
    TRY

    SUCCESS → RETURN + CLEAR ERRORS
    FAIL → EXCLUDE + CONTINUE

STOP AT maxIterations
```

---

## Key Guarantees

* No repeated DB reads inside retry loop
* No infinite loops
* Always attempts best available model first
* Recovers from full failure state automatically
* Maintains per-ApiKey failure memory

---
