import Parameters, {ParametersValue} from "./components/Parameters.tsx";
import {useEffect, useRef, useState} from "react";
import {LexicalComposer} from "@lexical/react/LexicalComposer";
import {ContentEditable} from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import {PlainTextPlugin} from "@lexical/react/LexicalPlainTextPlugin";
import {
    $createParagraphNode,
    $createTextNode,
    $getRoot,
    LexicalEditor,
    ParagraphNode,
    SerializedEditorState,
} from "lexical";
import {EditorRefPlugin} from "@lexical/react/LexicalEditorRefPlugin";
import {fetchEventSource} from "@microsoft/fetch-event-source";
import {useApiContext} from "./APIProvider.tsx";
import {useHistory} from "./HistoryContext.tsx";
import {HistoryPlugin} from "@lexical/react/LexicalHistoryPlugin";

interface CompletionsProps {
    promptState?: SerializedEditorState;
    parameters?: ParametersValue;
}

const Completions = (props: CompletionsProps) => {
    const [parameters, setParameters] = useState<ParametersValue>(props.parameters || {} as ParametersValue);
    const [prompt, setPrompt] = useState<string>("");
    const editorRef = useRef<LexicalEditor>(null)

    useEffect(() => {
        if (!editorRef.current) {
            return
        }
        editorRef.current.registerUpdateListener(({editorState}) => {
            editorState.read(() => {
                const root = $getRoot()
                setPrompt(root.getTextContent())
            })
        })
    }, []);

    useEffect(() => {
        if (editorRef.current && props.promptState) {
            const state = editorRef.current.parseEditorState(props.promptState)
            editorRef.current.setEditorState(state)
        }
    }, [editorRef, props.promptState]);

    // Create a ref for the messages
    useEffect(() => {
        setParameters(props.parameters || {} as ParametersValue);
    }, [props, setParameters])

    const history = useHistory()
    const apiContext = useApiContext();

    const submit = async () => {
        if (!editorRef.current) {
            return
        }
        if (parameters.model?.type !== "completions") {
            return
        }

        const start = new Date().getTime();
        let timeToFirstToken = 0;
        let outTokens = 0;
        let inTokens = 0;

        await fetchEventSource(`${apiContext.apiURL}/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "text/event-stream",
            },
            body: JSON.stringify({
                model: parameters.model.name,
                prompt: prompt,
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
                const content = data.choices[0].text
                if (!content || content === "") {
                    return;
                }
                outTokens++
                editorRef.current!.update(() => {
                    const root = $getRoot()
                    const textNode = $createTextNode(content)
                    textNode.setStyle("background-color: oklch(var(--a)); color: oklch(var(--n));")

                    const paragraphNode = root.getFirstChild() as ParagraphNode || $createParagraphNode()
                    paragraphNode.append(textNode)
                    root.append(paragraphNode)
                });
            },
            onclose: () => {
                // save to history
                history.addRecord({
                    timestamp: new Date(),
                    promptState: editorRef.current!.getEditorState().toJSON(),
                    parameters: parameters,
                    time_to_first_token: timeToFirstToken,
                    time_to_last_token: new Date().getTime() - start,
                    rating: 0,
                    input_tokens: inTokens,
                    output_tokens: outTokens,
                })
                editorRef.current!.update(() => {
                    const root = $getRoot()
                    const textNode = $createTextNode(" ")

                    const paragraphNode = root.getFirstChild() as ParagraphNode || $createParagraphNode()
                    paragraphNode.append(textNode)
                    root.append(paragraphNode)
                });
            }
        });
    }

    const initialConfig = {
        namespace: 'completions',
        onError: (error: Error) => {
            console.error(error);
        },
        theme: {},
    }

    return <div className="grid grid-cols-12 h-full overflow-auto gap-3 mb-3">
        <div className="col-span-10 flex flex-col gap-2">
            <div className="flex-grow">
                <LexicalComposer initialConfig={initialConfig}>
                    <div
                        className="relative textarea textarea-bordered form-control h-full w-full focus-within:border-primary focus-within:outline-1 p-0">
                        <EditorRefPlugin editorRef={editorRef}/>
                        <PlainTextPlugin
                            contentEditable={<ContentEditable
                                className="input pl-3.5 pt-1 h-full w-full outline-none"/>}
                            placeholder={<div
                                className="absolute overflow-ellipsis inline-block top-1 left-3.5 text-neutral-content">Enter
                                some text...</div>}
                            ErrorBoundary={LexicalErrorBoundary}
                        />
                    </div>
                    <HistoryPlugin/>
                </LexicalComposer>
            </div>
            <div className="flex">
                <button
                    className={`btn btn-primary`}
                    disabled={prompt === "" || !parameters.model}
                    onClick={async () => {
                        await submit()
                    }}
                >
                    Submit
                </button>
            </div>
        </div>
        <div className="col-span-2">
            <Parameters value={parameters} onChange={setParameters} type="completions"/>
        </div>
    </div>
}
export default Completions;