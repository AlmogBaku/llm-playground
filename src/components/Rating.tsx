import {Fragment} from "react";

function range(size: number, startAt: number = 0): ReadonlyArray<number> {
    return [...Array(size).keys()].map(i => i + startAt);
}

export const Rating = ({value, onChange}: { value?: number, onChange: (v: number) => void }) => {
    return <div className="rating rating-xs rating-half">
        <input type="radio" className="rating-hidden" checked={!value} readOnly/>
        {range(5).map((i) => (
            <Fragment key={i}><input type="radio"
                                     className={`mask mask-star-2 mask-half-1`} onChange={() => onChange(i + 0.5)}
                                     checked={value ? value == i + 0.5 : false}/>
                <input type="radio"
                       className={`mask mask-star-2 mask-half-2 mr-0.5`} onChange={() => onChange(i)}
                       checked={value ? value == i : false}/></Fragment>
        ))}
    </div>
}