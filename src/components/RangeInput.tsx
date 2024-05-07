interface RangeInputProps {
    label: string;
    value?: number;
    initial_value?: number;
    max: number;
    onChange?: (value?: number) => void;
    withDisableSwitch?: boolean;
    disableSwitchLabel?: string;
    factor?: number;
}

const RangeInput = ({
                        label,
                        value,
                        initial_value = 0,
                        max,
                        onChange,
                        withDisableSwitch,
                        disableSwitchLabel,
                        factor
                    }: RangeInputProps) => {
    const uiRangeFactor = factor || 100;


    const toggleDisabled = () => {
        onChange && onChange(value === undefined ? initial_value : undefined)
    }

    const onChangeHandler = (value: { target: { value: string; }; }) => {
        onChange && onChange(!value ? undefined : parseInt(value.target.value) / uiRangeFactor)
    }

    return <div className="form-control">
        <label className="label">
            <span className="label-text">{label}</span>
            <input type="input" className="label-text-alt input input-ghost text-right input-xs w-16 p-0"
                   value={value || 0}
                   onChange={onChangeHandler}/>
        </label>
        {value}
        <input type="range"
               min="0"
               max={max * uiRangeFactor}
               step={1}
               value={value ? value * uiRangeFactor : 0}
               className={`range ${!value ? " range-accent" : ""}`}
               disabled={value === undefined}
               onChange={onChangeHandler}
        />
        {withDisableSwitch && <div className="label">
            <span className="label-text capitalize">{disableSwitchLabel ? disableSwitchLabel : `No ${label}`}</span>
            <span className="label-text-alt">
                <input type="checkbox"
                       className="toggle toggle-xs toggle-accent"
                       checked={value === undefined}
                       onChange={toggleDisabled}
                />
            </span>
        </div>}
    </div>
}

export default RangeInput;