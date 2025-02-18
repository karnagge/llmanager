# LLM Backend API Documentation

## Authentication

Authentication is handled via API keys. Each API key is associated with both a tenant and a user, simplifying the authentication process and making it more compatible with OpenAI's API design.

### API Key Format
```
llm_<uuid>
```

Example: `llm_a1b2c3d4e5f6g7h8i9j0`

### Using API Keys

Include your API key in the `X-API-Key` header with all requests:

```bash
curl -X POST https://your-api.com/v1/chat/completions \
  -H "X-API-Key: llm_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Endpoints

### Chat Completions

Create a chat completion - compatible with OpenAI's chat completion endpoint.

```http
POST /v1/chat/completions
```

Request:
```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "Hello!"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 150
}
```

Response:
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-3.5-turbo",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! How can I assist you today?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 9,
    "completion_tokens": 12,
    "total_tokens": 21
  }
}
```

### Models

List available models.

```http
GET /v1/models
```

Response:
```json
{
  "data": [
    {
      "id": "gpt-4",
      "object": "model",
      "created": 1687882410,
      "owned_by": "openai"
    },
    {
      "id": "gpt-3.5-turbo",
      "object": "model",
      "created": 1677649963,
      "owned_by": "openai"
    }
  ]
}
```

## Error Handling

The API returns standard HTTP status codes and JSON error responses:

```json
{
  "error": {
    "message": "Invalid API key",
    "type": "authentication_error",
    "code": "invalid_api_key"
  }
}
```

Common status codes:
- 400: Bad Request
- 401: Unauthorized (Invalid API key)
- 403: Forbidden (Quota exceeded or insufficient permissions)
- 429: Too Many Requests (Rate limit exceeded)
- 500: Internal Server Error

## Rate Limiting

Rate limits are applied per API key. When exceeded, the API returns a 429 status code with a Retry-After header.

## Quotas

Each API key has an optional quota limit. Usage is tracked at three levels:
1. Tenant level
2. User level
3. API key level (if quota_limit is set)

Quotas are tracked in tokens, and when exceeded, the API returns a 403 status code.