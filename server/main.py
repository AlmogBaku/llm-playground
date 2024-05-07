from typing import Optional, List, Union, Literal

import tiktoken
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from pydantic import BaseModel
from openai.types.chat import ChatCompletionMessageParam
import os

load_dotenv()

app = FastAPI(
    title="Playground API",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    organization=os.getenv("OPENAI_ORGANIZATION") or None,
    base_url=os.getenv("OPENAI_BASE_URL") or None,
)


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


class Model(BaseModel):
    name: str
    description: str = ""
    type: Literal['chat', 'completions']
    system_prompt: Optional[bool] = None
    max_tokens: Optional[int] = None
    vendor: Optional[str] = None


@app.get("/models")
async def models():
    resp = await client.models.list()
    chat_models = [Model(name=model.id, system_prompt=True, type='chat', vendor='openai') for model in resp.data
                   if
                   model.id.startswith("gpt")]
    completion_models = [Model(name=model.id, type='completions', vendor='openai') for model in resp.data if
                         "instruct" in model.id]

    return chat_models + completion_models


class ChatCompletionsRequest(BaseModel):
    model: str
    messages: List[ChatCompletionMessageParam]
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    stop: Optional[Union[List[str], str]] = None
    stream: Optional[bool] = True


def num_tokens_from_messages(messages, model="gpt-3.5-turbo-0613"):
    """Return the number of tokens used by a list of messages."""
    try:
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        print("Warning: model not found. Using cl100k_base encoding.")
        encoding = tiktoken.get_encoding("cl100k_base")
    if model in {
        "gpt-3.5-turbo-0613",
        "gpt-3.5-turbo-16k-0613",
        "gpt-4-0314",
        "gpt-4-32k-0314",
        "gpt-4-0613",
        "gpt-4-32k-0613",
    }:
        tokens_per_message = 3
        tokens_per_name = 1
    elif model == "gpt-3.5-turbo-0301":
        tokens_per_message = 4  # every message follows <|start|>{role/name}\n{content}<|end|>\n
        tokens_per_name = -1  # if there's a name, the role is omitted
    elif "gpt-3.5-turbo" in model:
        print("Warning: gpt-3.5-turbo may update over time. Returning num tokens assuming gpt-3.5-turbo-0613.")
        return num_tokens_from_messages(messages, model="gpt-3.5-turbo-0613")
    elif "gpt-4" in model:
        print("Warning: gpt-4 may update over time. Returning num tokens assuming gpt-4-0613.")
        return num_tokens_from_messages(messages, model="gpt-4-0613")
    else:
        raise NotImplementedError(
            f"""num_tokens_from_messages() is not implemented for model {model}. See https://github.com/openai/openai-python/blob/main/chatml.md for information on how messages are converted to tokens."""
        )
    num_tokens = 0
    if not isinstance(messages, str):
        for message in messages:
            num_tokens += tokens_per_message
            for key, value in message.items():
                num_tokens += len(encoding.encode(value))
                if key == "name":
                    num_tokens += tokens_per_name
    num_tokens += 3  # every reply is primed with <|start|>assistant<|message|>
    return num_tokens


@app.post("/chat/completions")
async def chat_completions(req: ChatCompletionsRequest):
    req.stream = True
    if len(req.stop) == 0:
        req.stop = None
    opts = req.model_dump()

    resp = await client.chat.completions.create(**opts)

    async def event_stream():
        async for event in resp:
            yield f"event: completion\ndata: {event.json()}\n\n"

        yield f"event: input_tokens\ndata: {num_tokens_from_messages(req.messages, req.model)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


class CompletionsRequest(BaseModel):
    model: str
    prompt: str
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    stop: Optional[Union[List[str], str]] = None
    stream: Optional[bool] = True


@app.post("/completions")
async def completions(req: CompletionsRequest):
    req.stream = True
    if len(req.stop) == 0:
        req.stop = None
    opts = req.model_dump()

    resp = await client.completions.create(**opts)

    async def event_stream():
        async for event in resp:
            yield f"event: completion\ndata: {event.json()}\n\n"

        yield f"event: input_tokens\ndata: {num_tokens_from_messages(req.prompt, req.model)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", port=3000, log_level="info", reload=True, host="0.0.0.0")
