import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union

import tiktoken


def count_tokens(text: str, model: str = "gpt-3.5-turbo") -> int:
    """
    Count the number of tokens in a text string for a specific model
    """
    try:
        encoding = tiktoken.encoding_for_model(model)
        return len(encoding.encode(text))
    except KeyError:
        # Fallback to cl100k_base encoding if model-specific encoding not found
        encoding = tiktoken.get_encoding("cl100k_base")
        return len(encoding.encode(text))


def generate_hash(data: Union[str, bytes, Dict[str, Any]]) -> str:
    """
    Generate a SHA-256 hash of the input data
    """
    if isinstance(data, dict):
        data = json.dumps(data, sort_keys=True)
    if isinstance(data, str):
        data = data.encode()
    return hashlib.sha256(data).hexdigest()


def utc_now() -> datetime:
    """
    Get current UTC datetime
    """
    return datetime.now(timezone.utc)


def format_error_response(
    message: str, status_code: int, extra: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Format error response in a consistent way
    """
    response = {
        "error": {
            "message": message,
            "status_code": status_code,
            "timestamp": utc_now().isoformat(),
        }
    }
    if extra:
        response["error"].update(extra)
    return response


def sanitize_log_data(
    data: Dict[str, Any], sensitive_fields: List[str] = None
) -> Dict[str, Any]:
    """
    Sanitize sensitive data from log entries
    """
    if sensitive_fields is None:
        sensitive_fields = [
            "password",
            "token",
            "secret",
            "key",
            "authorization",
            "api_key",
        ]

    sanitized = {}
    for key, value in data.items():
        if any(field in key.lower() for field in sensitive_fields):
            sanitized[key] = "[REDACTED]"
        elif isinstance(value, dict):
            sanitized[key] = sanitize_log_data(value, sensitive_fields)
        else:
            sanitized[key] = value
    return sanitized


def calculate_token_cost(
    prompt_tokens: int, completion_tokens: int, model: str
) -> float:
    """
    Calculate the cost of token usage based on the model
    """
    # Token costs in USD per 1K tokens (approximate values)
    model_costs = {
        "gpt-4": {"prompt": 0.03, "completion": 0.06},
        "gpt-4-32k": {"prompt": 0.06, "completion": 0.12},
        "gpt-3.5-turbo": {"prompt": 0.0015, "completion": 0.002},
        "gpt-3.5-turbo-16k": {"prompt": 0.003, "completion": 0.004},
    }

    if model not in model_costs:
        # Default to gpt-3.5-turbo pricing if model not found
        model = "gpt-3.5-turbo"

    prompt_cost = (prompt_tokens / 1000) * model_costs[model]["prompt"]
    completion_cost = (completion_tokens / 1000) * model_costs[model]["completion"]

    return round(prompt_cost + completion_cost, 6)


def format_webhook_payload(
    event_type: str, data: Dict[str, Any], timestamp: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Format webhook payload in a consistent way
    """
    if timestamp is None:
        timestamp = utc_now()

    return {"event_type": event_type, "timestamp": timestamp.isoformat(), "data": data}


def chunk_text(
    text: str, max_tokens: int, model: str = "gpt-3.5-turbo", overlap: int = 100
) -> List[str]:
    """
    Split text into chunks based on token limit with optional overlap
    """
    tokens = count_tokens(text, model)
    if tokens <= max_tokens:
        return [text]

    encoding = tiktoken.encoding_for_model(model)
    tokens_list = encoding.encode(text)

    chunks = []
    start_idx = 0

    while start_idx < len(tokens_list):
        chunk_tokens = tokens_list[start_idx : start_idx + max_tokens]
        chunk = encoding.decode(chunk_tokens)
        chunks.append(chunk)

        # Move start index, accounting for overlap
        start_idx += max_tokens - overlap

    return chunks


def validate_tenant_config(config: Dict[str, Any]) -> List[str]:
    """
    Validate tenant configuration and return list of validation errors
    """
    errors = []
    required_fields = ["name", "quota_limit", "rate_limit"]

    for field in required_fields:
        if field not in config:
            errors.append(f"Missing required field: {field}")

    if "quota_limit" in config and not isinstance(config["quota_limit"], int):
        errors.append("quota_limit must be an integer")

    if "rate_limit" in config:
        rate_limit = config["rate_limit"]
        if not isinstance(rate_limit, dict):
            errors.append("rate_limit must be an object")
        elif "requests" not in rate_limit or "period" not in rate_limit:
            errors.append("rate_limit must contain 'requests' and 'period' fields")

    return errors


def get_tenant_database_name(tenant_id: str, prefix: str = "tenant_") -> str:
    """
    Generate database name for a tenant
    """
    # Sanitize tenant_id to be database-name safe
    safe_tenant_id = "".join(c.lower() for c in tenant_id if c.isalnum())
    return f"{prefix}{safe_tenant_id}"
