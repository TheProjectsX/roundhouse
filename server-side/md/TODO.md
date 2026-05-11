# Codex Auth:

- Check `oauth_cli_kit`
- Create URI with Frontend
- Frontend takes and sends them in backend with another API
- Calculates and checks and saves

- ollama




[2026-05-11T08:52:47.217Z] [openai.chat] chatCompletions stream provider call started {
  providerSelectionId: '6a0197b626f2147a1fa0788c',
  modelSelectionId: '6a0197b726f2147a1fa0788f',
  modelId: '69f48ea7aa32db3e148c3447',
  providerType: 'GEMINI',
  apiKeysManagerId: '69ff4ca358c17ec95fb9ef14'
}
Error: Function call is missing a thought_signature in functionCall parts. This is required for tools to work correctly, and missing thought_signature may lead to degraded model performance. Additional data, function call `default_api:read_file` , position 4. Please refer to https://ai.google.dev/gemini-api/docs/thought-signatures for more details.
    at callModel (D:\Modasser_Workspace\Tests\roundhouse\server-side\src\core\models\gemini\model.ts:168:15)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async Object.callGeminiChatCompletion (D:\Modasser_Workspace\Tests\roundhouse\server-side\src\core\models\gemini\index.ts:171:22)
    at async createChatCompletionStreamWithUsage (D:\Modasser_Workspace\Tests\roundhouse\server-side\src\core\api-wrapper\service.ts:199:22)
    at async streamedResult.executor.provider.provider (D:\Modasser_Workspace\Tests\roundhouse\server-side\src\modules\openai\openai.service.ts:205:33)
    at async OpenaiService.executor (D:\Modasser_Workspace\Tests\roundhouse\server-side\src\core\services\roundhouse\roundhouse.service.ts:511:28)
    at async OpenaiService.chatCompletions (D:\Modasser_Workspace\Tests\roundhouse\server-side\src\modules\openai\openai.service.ts:183:40)