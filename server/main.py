from contextlib import asynccontextmanager
from typing import List, AsyncIterator

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from openai import AsyncOpenAI

from src.oai_tokens import num_tokens_from_messages
from src.types import Model, CompletionsRequest, ChatCompletionsRequest, Settings

models: List[Model] = []
default_client: AsyncOpenAI
settings = Settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global default_client, models, settings

    default_client = AsyncOpenAI(
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
        organization=settings.openai_organization
    )

    if ((settings.openai_base_url is None)
            and settings.openai_api_key
            and (settings.models.oai_urls is None or ("https://api.openai.com/v1" not in settings.models.oai_urls))):
        if settings.models.oai_urls is None:
            settings.models.oai_urls = []
        settings.models.oai_urls.append("https://api.openai.com/v1")

    for url in settings.models.oai_urls or []:
        cli = AsyncOpenAI(
            api_key=settings.openai_api_key,
            base_url=url,
        )
        resp = await cli.models.list()
        models += [
            Model(name=model.id, system_prompt=True, type='chat', vendor='openai')
            for model in resp.data if model.id.startswith("gpt")
        ]
        models += [
            Model(name=model.id, type='completions', vendor='openai')
            for model in resp.data if "instruct" in model.id
        ]

    for url in settings.models.urls or []:
        models += [Model(**model) for model in httpx.get(url).json()]

    if settings.models.models:
        models += settings.models.models

    yield


app = FastAPI(
    title="Playground API",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


async def event_stream(resp: AsyncIterator, prompt, model: Model):
    tokens = 0
    async for event in resp:
        if "usage" in event:
            tokens += event.usage.tokens
        yield f"event: completion\ndata: {event.json()}\n\n"

    if tokens == 0 and model.vendor == "openai":
        tokens = num_tokens_from_messages(prompt, model.name)
    yield f"event: input_tokens\ndata: {tokens}\n\n"


@app.get("/api/models")
async def get_models():
    return models


def client(model: Model) -> AsyncOpenAI:
    if model.api_key:
        return AsyncOpenAI(
            api_key=model.api_key,
        )

    return default_client


@app.post("/api/chat/completions")
async def chat_completions(req: ChatCompletionsRequest):
    model = next((model for model in models if model.name == req.model), None)
    if not model:
        return {"error": "Model not found."}

    resp = await client(model).chat.completions.create(**req.model_dump())
    return StreamingResponse(event_stream(resp, req.messages, model), media_type="text/event-stream")


@app.post("/api/completions")
async def completions(req: CompletionsRequest):
    model = next((model for model in models if model.name == req.model), None)
    if not model:
        return {"error": "Model not found."}

    resp = await client(model).completions.create(**req.model_dump())
    return StreamingResponse(event_stream(resp, req.prompt, model), media_type="text/event-stream")


if settings.dist_dir:
    app.mount('/static', StaticFiles(directory=settings.dist_dir), name='static')


@app.get('/')
def index():
    if settings.dist_dir:
        return FileResponse(f'{settings.dist_dir}/index.html')
    return FileNotFoundError


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", port=3000, log_level="info", reload=True, host="0.0.0.0")
