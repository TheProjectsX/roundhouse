## Goal:
Currently our backend isn't saving `model` call history, which should not happen. So here is what we will do. 

- Create another model `ModelSelection` -> connected with `ProviderSelection` in-place of `models` and `userModels` containing `model` or `userModel`.

After each request, increase that model's token usage, success, failure counts, basic statistics.
- Run the saving process in background so that the response does not have to wait.

- Add the statistics in the response of ApiKey details (single api key get)