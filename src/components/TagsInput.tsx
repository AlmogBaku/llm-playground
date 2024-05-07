import {KeyboardEventHandler, useEffect, useState} from 'react';

import {StyledCreatableSelect} from "./StyledSelect.tsx";

interface Option {
    readonly label: string;
    readonly value: string;
}

type onChange = (value: string[]) => void;
const TagsInput = ({onChange, value: initial_value}: { onChange?: onChange, value?: readonly string[] }) => {
    const createOption = (label: string) => ({
        label,
        value: label,
    });

    const [inputValue, setInputValue] = useState('');
    const [value, setValue] = useState<readonly Option[]>(
        (initial_value || []).map(createOption)
    );

    const handleKeyDown: KeyboardEventHandler = (event) => {
        if (!inputValue) return;
        switch (event.key) {
            case 'Enter':
            case 'Tab':
                setValue((prev) => [...prev, createOption(inputValue)]);
                setInputValue('');
                event.preventDefault();
        }
    };

    useEffect(() => {
        onChange && onChange(value.map((option) => option.value));
    }, [onChange, value]);

    const components = {
        DropdownIndicator: null
    }

    return <StyledCreatableSelect
        components={components}
        inputValue={inputValue}
        isClearable
        isMulti
        menuIsOpen={false}
        onChange={(newValue) => setValue(newValue)}
        onInputChange={(newInputValue) => setInputValue(newInputValue)}
        onKeyDown={handleKeyDown}
        placeholder=""
        value={value}
    />;
};
export default TagsInput;