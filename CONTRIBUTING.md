# Contributing to LLM Backend

First off, thank you for considering contributing to LLM Backend! It's people like you that make this project such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps which reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include logs and screenshots if possible

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* Use a clear and descriptive title
* Provide a step-by-step description of the suggested enhancement
* Provide specific examples to demonstrate the steps
* Describe the current behavior and explain which behavior you expected to see instead
* Explain why this enhancement would be useful

### Pull Requests

* Fork the repo and create your branch from `main`
* If you've added code that should be tested, add tests
* If you've changed APIs, update the documentation
* Ensure the test suite passes
* Make sure your code lints

## Development Process

1. Set up your development environment:
```bash
# Clone your fork
git clone https://github.com/your-username/llm-backend.git

# Install dependencies
poetry install

# Set up pre-commit hooks
poetry run pre-commit install
```

2. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

3. Make your changes:
* Write meaningful commit messages
* Follow the code style
* Add tests for new functionality
* Update documentation as needed

4. Run tests and linting:
```bash
# Run tests
poetry run pytest

# Run linting
poetry run flake8
poetry run mypy src

# Format code
poetry run black src tests
poetry run isort src tests
```

5. Submit a pull request:
* Fill in the required template
* Do not include issue numbers in the PR title
* Include screenshots and animated GIFs if relevant

## Style Guide

### Python Code Style

* Follow PEP 8 style guide
* Use type hints for all function arguments and return values
* Use docstrings for all public modules, functions, classes, and methods
* Keep functions focused and small
* Use meaningful variable names

Example:
```python
from typing import List, Optional

def process_data(items: List[str], limit: Optional[int] = None) -> List[str]:
    """
    Process a list of items with an optional limit.

    Args:
        items: List of strings to process
        limit: Optional maximum number of items to process

    Returns:
        List of processed strings
    """
    if limit is not None:
        items = items[:limit]
    return [item.strip().lower() for item in items]
```

### Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

Example:
```
Add token usage tracking for chat completions

- Implement token counting using tiktoken
- Add usage logging to database
- Update quota tracking in Redis
- Add tests for token counting and quota updates

Fixes #123
```

### Documentation

* Use Markdown for documentation
* Include code examples when relevant
* Keep documentation up to date with code changes
* Document both success and error scenarios
* Include performance implications when relevant

## Testing

### Unit Tests

* Write unit tests for all new functionality
* Use pytest as the testing framework
* Mock external services and dependencies
* Include both positive and negative test cases
* Test edge cases and error conditions

Example:
```python
import pytest
from src.services.quota import QuotaService

@pytest.mark.asyncio
async def test_check_quota_success():
    service = QuotaService()
    result = await service.check_quota(
        tenant_id="test",
        user_id="user1",
        requested_tokens=100
    )
    assert result is True

@pytest.mark.asyncio
async def test_check_quota_exceeded():
    service = QuotaService()
    with pytest.raises(QuotaExceededError):
        await service.check_quota(
            tenant_id="test",
            user_id="user1",
            requested_tokens=1000000
        )
```

### Integration Tests

* Write integration tests for API endpoints
* Test database interactions
* Test Redis operations
* Test external service integrations
* Use test containers for dependencies

## Release Process

1. Update version number in `pyproject.toml`
2. Update CHANGELOG.md
3. Create a new release branch: `release/vX.Y.Z`
4. Run full test suite
5. Create a GitHub release with release notes
6. Merge release branch to main
7. Deploy to production

## Questions?

Feel free to ask for help! You can:
* Open an issue
* Join our Discord channel
* Contact the maintainers directly

## License

By contributing, you agree that your contributions will be licensed under the MIT License.