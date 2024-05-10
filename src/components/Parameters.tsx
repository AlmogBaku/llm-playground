import {StyledCreatableSelect, StyledSelect} from "./StyledSelect.tsx";
import {Model, useApiContext} from "../APIProvider.tsx";
import {useCallback, useEffect, useState} from "react";
import TagsInput from "./TagsInput.tsx";
import RangeInput from "./RangeInput.tsx";
import {projectName} from "./HistoricalBrowser.tsx";
import {useHistory} from "../HistoryContext.tsx";
import deepEqual from "../deepEqual.ts";

interface ModelOption {
    value: string;
    label: string;
    model: Model;
}

export interface ParametersValue {
    model?: Model;
    temperature?: number;
    max_tokens?: number;
    stop?: string[];
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    project?: string;
}

interface ParametersProps {
    value: ParametersValue;
    onChange?: (parameters: ParametersValue) => void;
    type?: "chat" | "completions";
}

const Parameters = ({value, onChange, type}: ParametersProps) => {
    const [models, setModels] = useState<ModelOption[]>([]);
    const apiContext = useApiContext();
    const history = useHistory();
    const projects = Array.from(new Set(history.records.map((record) => record.parameters.project || ""))) || [""];

    const onChangeHandler = useCallback((params: ParametersValue) => {
        const newParams = {...value, ...params}
        if (deepEqual(newParams, value)) {
            return;
        }
        onChange && onChange(newParams);
    }, [value, onChange]);

    useEffect(() => {
        const all_models = apiContext.models
        const m: ModelOption[] = all_models
            .filter((model) => model.type == type)
            .map((model) => {
                return {value: model.name, label: model.name, model: model}
            });
        setModels(m);
        if (!value.model && m.length > 0) {
            onChangeHandler({
                model: all_models.find((model) => model.name === "gpt-4" && model.type == type) || m[0].model
            });
        }
        if (!value.max_tokens && type === "completions") {
            onChangeHandler({max_tokens: 256})
        }
    }, [type, value, onChangeHandler, setModels, apiContext]);

    return <div className="flex flex-col gap-y-6">

        <div className="flex form-control tooltip tooltip-left" data-tip={
            "The project to which this completion belongs. This is useful for tracking and organizing experiments."
        }>
            <label className="label">
                <span className="label-text">Project</span>
            </label>
            <StyledCreatableSelect
                className="w-48 mb-5"
                options={projects.map((project) => {
                    return {value: project, label: projectName(project)}
                })}
                value={value.project ? {
                    value: value.project,
                    label: projectName(value.project)
                } : {value: "", label: projectName("")}}
                onChange={(selectedOption) => onChangeHandler({project: selectedOption!.value})}
            />
        </div>

        <div className="flex form-control tooltip tooltip-left" data-tip={
            "The model which will generate the completion. Some models are suitable for natural language tasks, " +
            "others specialize in code."
        }>
            <label className="label">
                <span className="label-text">Model</span>
            </label>
            <StyledSelect
                value={models.find(m => m.model.name === value.model?.name)}
                onChange={(o) => onChangeHandler({model: o?.model})}
                options={models}
                isLoading={models.length === 0}
            />
        </div>
        <div className="tooltip tooltip-left" data-tip={
            "Controls randomness: Lowering results in less random completions. " +
            "As the temperature approaches zero, the model will become deterministic and repetitive."
        }>
            <RangeInput label={"Temperature"} value={value.temperature || 1}
                        max={2} onChange={(e) => onChangeHandler({temperature: e})}
            />
        </div>
        <div className="tooltip tooltip-left" data-tip={
            "The maximum number of tokens to generate shared between the prompt and completion. " +
            "The exact limit varies by model. (One token is roughly 4 characters for standard English text)"
        }>
            <RangeInput label={"Maximum tokens"} value={value.max_tokens}
                        max={value.model?.maxTokens || 2048}
                        withDisableSwitch={type==="chat"}
                        onChange={(v) => onChangeHandler({max_tokens: v})}
                        factor={1}
            />
        </div>

        <div className="form-control tooltip tooltip-left" data-tip={
            "Up to four sequences where the API will stop generating further tokens. " +
            "The returned text will not contain the stop sequence."
        }>
            <label className="label">
                <span className="label-text">Stop sequence</span>
            </label>
            <TagsInput onChange={(v) => onChangeHandler({stop: v})} value={value.stop}/>
        </div>

        <div className="tooltip tooltip-left" data-tip={
            "Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered."
        }>
            <RangeInput label={"Top P"}
                        value={value.top_p}
                        max={1}
                        initial_value={1}
                        onChange={(v) => onChangeHandler({top_p: v})}
                        withDisableSwitch
            />
        </div>

        <div className="tooltip tooltip-left" data-tip={
            "Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered."
        }>
            <RangeInput label={"Frequency penalty"}
                        value={value.frequency_penalty}
                        max={1}
                        onChange={(v) => onChangeHandler({frequency_penalty: v})}
                        withDisableSwitch
            />
        </div>

        <div className="tooltip tooltip-left" data-tip={
            "How much to penalize new tokens based on whether they appear in the text so far. " +
            "Increases the model's likelihood to talk about new topics."
        }>
            <RangeInput label={"Presence penalty"}
                        value={value.presence_penalty}
                        max={1}
                        onChange={(v) => onChangeHandler({presence_penalty: v})}
                        withDisableSwitch
            />
        </div>
    </div>
}

export default Parameters;