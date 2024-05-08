from typing import Literal, Optional, List, Union

from openai.types.chat import ChatCompletionMessageParam
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Model(BaseModel):
    name: str
    description: str = ""
    type: Literal['chat', 'completions']
    system_prompt: Optional[bool] = None
    max_tokens: Optional[int] = None
    vendor: Optional[str] = None
    api_key: Optional[str] = Field(None, hidden=True)


class ModelsConfig(BaseModel):
    urls: Optional[List[str]] = None
    oai_urls: Optional[List[str]] = None
    models: Optional[List[Model]] = None


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', yaml_file='settings.yaml')

    openai_api_key: Optional[str] = None
    openai_organization: Optional[str] = None
    openai_base_url: Optional[str] = None

    models: ModelsConfig = ModelsConfig()

    dist_dir: Optional[str] = None


class ChatCompletionsRequest(BaseModel):
    model: str
    messages: List[ChatCompletionMessageParam]
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    stop: Optional[Union[List[str], str]] = None
    stream: Literal[True] = True

    def __init__(self, **data) -> None:
        if 'stop' in data and not data['stop']:
            data['stop'] = None
        data['stream'] = True
        super().__init__(**data)


class CompletionsRequest(BaseModel):
    model: str
    prompt: str
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    stop: Optional[Union[List[str], str]] = None
    stream: Literal[True] = True

    def __init__(self, **data) -> None:
        if 'stop' in data and not data['stop']:
            data['stop'] = None
        data['stream'] = True
        super().__init__(**data)
