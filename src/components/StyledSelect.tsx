import Select from 'react-select'
import StateManagedSelect from 'react-select'
import './StyledSelect.css'
import CreatableSelect from "react-select/creatable";

export const StyledSelect: StateManagedSelect = (props) => {
    return <Select
        className={props.className}
        classNamePrefix='react-select'
        unstyled
        menuPosition={"fixed"}
        {...props}
    />
}

export const StyledCreatableSelect: StateManagedSelect = (props) => {
    return <CreatableSelect
        className={props.className}
        classNamePrefix='react-select'
        unstyled
        menuPosition={"fixed"}
        isClearable
        {...props}
    />
}