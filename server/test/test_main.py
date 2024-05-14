import json
from contextlib import contextmanager
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionChunk
from openai.types.completion import Completion
from pydantic import BaseModel
from sseclient import SSEClient
from starlette.routing import _DefaultLifespan

from .oai_mock import mock_completion_generator, mock_chat_completion_generator
from .. import main
from ..src.protocol import Model


@contextmanager
def setup_test_environment():
    main.models = [
        Model(name="gpt-3.5-turbo", type="chat", vendor="openai"),
        Model(name="gpt-3.5-turbo", type="completions", vendor="openai")
    ]
    main.default_client = AsyncOpenAI(api_key="...")
    main.default_client.chat.completions.create = AsyncMock(side_effect=mock_chat_completion_generator)
    main.default_client.completions.create = AsyncMock(side_effect=mock_completion_generator)
    main.app.router.lifespan_context = _DefaultLifespan(main.app.router)
    with TestClient(main.app) as client:
        yield client


def test_lifespan():
    with setup_test_environment() as client:
        # Test that the lifespan function sets up the default client and models correctly
        response = client.get("/healthz")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


def test_get_models():
    with setup_test_environment() as client:
        # Test that the GET /api/models endpoint returns the list of models
        response = client.get("/api/models")
        assert response.status_code == 200
        models = response.json()
        assert isinstance(models, list)
        assert len(models) > 0


def event_source(response):
    for b in response.iter_bytes():
        yield b


@pytest.mark.asyncio
async def test_chat_completions():
    with setup_test_environment() as client:
        # Test that the POST /api/chat/completions endpoint returns a streaming response
        data = {"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "Hello"}]}
        response = client.post("/api/chat/completions", json=data)
        assert response.status_code == 200
        assert response.headers.get("Content-Type") == 'text/event-stream; charset=utf-8'

        output = ""
        toks = 0
        for evnt in SSEClient(event_source(response)).events():
            if evnt.event == "completion":
                chunk = ChatCompletionChunk(**json.loads(evnt.data))
                if chunk.choices[0].delta.content:
                    output += chunk.choices[0].delta.content
            elif evnt.event == "input_tokens":
                toks = int(evnt.data)

        assert output == "Hello world!"
        assert toks == 8


@pytest.mark.asyncio
async def test_completions():
    with setup_test_environment() as client:
        # Test that the POST /api/completions endpoint returns a streaming response
        data = {"model": "gpt-3.5-turbo", "prompt": "Hello"}
        response = client.post("/api/completions", json=data)
        assert response.status_code == 200
        assert response.headers.get("Content-Type") == 'text/event-stream; charset=utf-8'

        output = ""
        toks = 0
        for evnt in SSEClient(event_source(response)).events():
            if evnt.event == "completion":
                chunk = Completion.model_construct(**json.loads(evnt.data))
                if chunk.choices[0].text:
                    output += chunk.choices[0].text
            elif evnt.event == "input_tokens":
                toks = int(evnt.data)

        assert output == "Hello world!"
        assert toks == 3


class Usage(BaseModel):
    tokens: int


class MockResponse(BaseModel):
    usage: Usage
    text: str


@pytest.mark.asyncio
async def test_event_stream():
    # Test that the event_stream function yields the correct events
    async def mock_resp():
        yield MockResponse(usage=Usage(tokens=10), text="Hello, world!")

    model = Model(name="gpt-3.5-turbo", type="chat", vendor="openai")
    events = []
    async for event in main.event_stream(mock_resp(), "Hello", model):
        events.append(event)
    assert events == [
        'event: completion\ndata: {"usage":{"tokens":10},"text":"Hello, world!"}\n\n',
        'event: input_tokens\ndata: 10\n\n'
    ]


def test_client():
    with setup_test_environment() as client:
        # Test that the client function returns a properly configured AsyncOpenAI client
        model = Model(name="gpt-3.5-turbo", type="chat", vendor="openai", base_url="https://api.example.com/v1/",
                      api_key="test_key")
        cli = main.client(model)
        assert isinstance(cli, AsyncOpenAI)
        assert str(cli.base_url) == "https://api.example.com/v1/"
        assert cli.api_key == "test_key"
