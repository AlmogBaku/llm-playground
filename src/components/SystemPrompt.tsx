interface SystemPromptProps {
    defaultValue?: string;
    onChange?: (value: string) => void;
    value?: string;
    disabled?: boolean;
}

const SystemPrompt = ({defaultValue = "You are a helpful assistant", onChange, value, disabled}: SystemPromptProps) => {
    return <label
        className="textarea textarea-bordered form-control h-full w-full focus-within:border-primary focus-within:outline-1">
        <div className="label">
            <span className="label-text">System Prompt</span>
        </div>
        <textarea
            className="outline-none h-full w-full resize-none bg-transparent"
            placeholder={defaultValue}
            disabled={disabled === undefined ? false : disabled}
            onChange={(e) => onChange && onChange(e.target.value)}
            value={value}
        />
    </label>;
};

export default SystemPrompt;