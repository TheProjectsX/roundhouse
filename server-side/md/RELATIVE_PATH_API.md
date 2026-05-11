## Goal:
Currently API at `/v1` takes API Key at headers. But some systems may not have the feature to use the header. So, we will take the ApiKey in path.

## API Format:
- `/v1/x-api/:apiKey/....`

## Plan:
- Making `/v1/x-api/:apiKey/` the base, it will support the other Already existed paths:
    - `/v1/x-api/:apiKey/chat/completions`
    - `/v1/x-api/:apiKey/models`

