## Goal: Convert the Model selection to Priority based selection

Currently, our project uses `RANDOM` and `EFFICIENCY` based roundhouse. But we would like to add one more and make it default.
We will add a new RoundhouseMethod: `PRIORITY`.

## Changes:

Roundhouse will also have now model priority based roundhouse. Each `ModelSelection` will have an additional property, `priority Int`.
When the roundhouse type becomes `PRIORITY` by either saved config or headers config, roundhouse will use model priority to call the model.

- Roundhouse flow:
    - Get the roundhouse type - by either headers or db
    - For each "roundhouse" type, there will be dedicated functions which will take the models and roundhouse them based on their type
    - For `RANDOM` - it will be random choice
    - For `EFFICIENCY` - it will be based on model efficiency
    - For `PRIORITY` - it will be model based priority configured by user

## Routes:

- Add a new route to `GET` all the `ModelSelection` of a certain ApiKey with the model name and provider name with efficiency, bestFor. basically everything needs to identify the model.
- Add a new route to `PATCH` all the `ModelSelection` - reordering them in their `priority`
- The `priority` will be from 1 to N
