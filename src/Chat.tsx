import {useEffect, useRef, useState} from "react";
import SystemPrompt from "./components/SystemPrompt";
import Message, {MessageType} from "./components/Message";
import {TbCirclePlus} from "react-icons/tb";
import Parameters, {ParametersValue} from "./components/Parameters.tsx";
import {useApiContext} from "./APIProvider.tsx";
import {fetchEventSource} from "@microsoft/fetch-event-source";
import {useHistory} from "./HistoryContext.tsx";

interface ChatCompletionProps {
    systemPrompt?: string;
    messages?: MessageType[];
    parameters?: ParametersValue;
}

const ChatCompletion = (props: ChatCompletionProps = {}) => {
    const [systemPrompt, setSystemPrompt] = useState<string>(props.systemPrompt || "");
    const [messages, setMessages] = useState<MessageType[]>(props.messages || [{role: "user", content: ""}]);
    const [parameters, setParameters] = useState<ParametersValue>(props.parameters || {} as ParametersValue);

    useEffect(() => {
        setMessages(props.messages || [{role: "user", content: ""}]);
        setParameters(props.parameters || {} as ParametersValue);
        setSystemPrompt(props.systemPrompt || "");
    }, [props, setMessages, setParameters, setSystemPrompt]);

    const history = useHistory()

    // Create a ref for the messages
    const messagesRef = useRef<MessageType[]>([{role: "user", content: ""}]);
    // Update the ref whenever messages changes
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const addMessage = () => {
        setMessages((prev) => [...prev, {
            role: prev.length === 0 || prev[prev.length - 1].role === "assistant" ? "user" : "assistant",
            content: ""
        }]);
    }
    const apiContext = useApiContext();

    const submit = async () => {
        let msgs = systemPrompt === "" ? messages : [{role: "system", content: systemPrompt}, ...messages];
        // remove empty messages
        msgs = msgs.filter((msg) => msg.content !== "");
        if (msgs.length === 0) {
            return;
        }
        if (parameters.model?.type !== "chat") {
            return
        }

        if (!(messages[messages.length - 1].role === "assistant" && messages[messages.length - 1].content === "")) {
            setMessages((prev) => [...prev, {role: "assistant", content: ""}])
        }
        const start = new Date().getTime();
        let timeToFirstToken = 0;
        let outTokens = 0;
        let inTokens = 0;

        await fetchEventSource(`${apiContext.apiURL}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "text/event-stream",
            },
            body: JSON.stringify({
                model: parameters.model.name,
                messages: msgs,
                max_tokens: parameters.max_tokens,
                temperature: parameters.temperature,
                top_p: parameters.top_p,
                stop: parameters.stop,
                frequency_penalty: parameters.frequency_penalty,
                presence_penalty: parameters.presence_penalty,
            }),
            onmessage: (event) => {
                if (event.event === "input_tokens") {
                    inTokens = parseInt(event.data);
                    return;
                }
                if (event.event !== "completion") {
                    return;
                }

                if (timeToFirstToken === 0) {
                    timeToFirstToken = new Date().getTime() - start;
                }
                const data = JSON.parse(event.data);
                const content = data.choices[0].delta.content
                if (!content || content === "") {
                    return;
                }
                outTokens++
                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMessage = {...newMessages[newMessages.length - 1]};
                    lastMessage.content += content;
                    newMessages[newMessages.length - 1] = lastMessage;
                    return newMessages;
                });
            },
            onclose: () => {
                // save to history
                history.addRecord({
                    timestamp: new Date(),
                    systemPrompt: systemPrompt,
                    messages: messagesRef.current,
                    parameters: parameters,
                    time_to_first_token: timeToFirstToken,
                    time_to_last_token: new Date().getTime() - start,
                    rating: 0,
                    input_tokens: inTokens,
                    output_tokens: outTokens,
                })
            }
        });
    }

    return <div id="chat-completion" className="grid grid-cols-12 h-full overflow-auto gap-3 mb-3">
        <div className="col-span-4">
            <SystemPrompt
                value={systemPrompt}
                onChange={(val) => setSystemPrompt(val)}
                disabled={parameters.model?.type !== "chat" || parameters.model?.system_prompt === false}
            />
        </div>
        <div className="col-span-6 flex flex-col justify-between">
            <div className="h-full">
                {messages.map((message, index) => (
                    <Message
                        key={index}
                        value={message}
                        onChange={(val) => {
                            setMessages((prev) => {
                                const newMessages = [...prev];
                                newMessages[index] = val;
                                return newMessages;
                            })
                        }}
                        onRemove={() => setMessages((prev) => {
                            const newMessages = [...prev];
                            newMessages.splice(index, 1);
                            return newMessages;
                        })}
                    />
                ))}
                <button className={`btn btn-outline mb-3`} onClick={addMessage}>
                    <TbCirclePlus className="w-5 h-5"/> Add Message
                </button>
            </div>
            <div className="flex gap-2">
                <button
                    className={`btn btn-primary`}
                    onClick={async () => {
                        await submit()
                    }}
                    disabled={messages.filter((msg) => msg.content !== "").length === 0}
                >
                    Submit
                </button>
            </div>
        </div>
        <div className="col-span-2">
            <Parameters value={parameters} onChange={setParameters} type="chat"/>
        </div>
    </div>
};

export default ChatCompletion;
