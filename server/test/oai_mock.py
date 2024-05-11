from openai.types.chat.chat_completion_chunk import ChatCompletionChunk, Choice, ChoiceDelta
from openai.types.completion import Completion, CompletionChoice


async def mock_completion_generator(*args, **kwargs):
    yield Completion(
        id="test-id",
        object="text_completion",
        created=1,
        model="",
        choices=[CompletionChoice.model_construct(text=f"Hello", index=0)],
    )
    yield Completion(
        id="test-id",
        object="text_completion",
        created=1,
        model="",
        choices=[CompletionChoice.model_construct(text=f" ", index=1)],
    )
    yield Completion(
        id="test-id",
        object="text_completion",
        created=1,
        model="",
        choices=[CompletionChoice.model_construct(text=f"world", index=2)],
    )
    yield Completion(
        id="test-id",
        object="text_completion",
        created=1,
        model="",
        choices=[CompletionChoice.model_construct(text=f"!", index=3)],
    )
    yield Completion(
        id="test-id",
        object="text_completion",
        created=1,
        model="",
        choices=[CompletionChoice.model_construct(text="", index=4, finish_reason="stop")],
    )


async def mock_chat_completion_generator(*args, **kwargs):
    yield ChatCompletionChunk(
        id="test-id",
        created=1,
        object="chat.completion.chunk",
        model="",
        choices=[
            Choice(
                delta=ChoiceDelta(
                    role="assistant",
                    content="Hello",
                ),
                index=0,
            )
        ],
    )
    yield ChatCompletionChunk(
        id="test-id",
        created=1,
        object="chat.completion.chunk",
        model="",
        choices=[
            Choice(
                delta=ChoiceDelta(
                    role="assistant",
                    content=" ",
                ),
                index=1,
            )
        ],
    )
    yield ChatCompletionChunk(
        id="test-id",
        created=1,
        object="chat.completion.chunk",
        model="",
        choices=[
            Choice(
                delta=ChoiceDelta(
                    role="assistant",
                    content="world",
                ),
                index=2,
            )
        ],
    )
    yield ChatCompletionChunk(
        id="test-id",
        created=1,
        object="chat.completion.chunk",
        model="",
        choices=[
            Choice(
                delta=ChoiceDelta(
                    role="assistant",
                    content="!",
                ),
                index=3,
            )
        ],
    )
    yield ChatCompletionChunk(
        id="test-id",
        created=1,
        object="chat.completion.chunk",
        model="",
        choices=[
            Choice(
                delta=ChoiceDelta(),
                finish_reason="stop",
                index=4,
            )
        ],
    )
