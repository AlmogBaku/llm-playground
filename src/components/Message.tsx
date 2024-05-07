import {useEffect, useRef, useState} from "react";
import {TbCircleMinus} from "react-icons/tb";

export type RoleType = 'user' | 'assistant';

export interface MessageType {
    role: RoleType;
    content: string;
}

interface MessageProps {
    onChange?: (value: MessageType) => void;
    value: MessageType;
    onRemove?: () => void;
}

const Message = ({onChange, value, onRemove}: MessageProps) => {
    const [placeholder, setPlaceholder] = useState<string>("");

    useEffect(() => {
        setPlaceholder(`Enter ${value?.role === "user" ? "a user" : "an assistant"} message here.`);
    }, [setPlaceholder, value.role])
    const changeRole = () => {
        onChange && onChange({role: value.role === "user" ? "assistant" : "user", content: value.content});
    }

    const contentRef = useRef<HTMLTextAreaElement>(null);

    const changeContent = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange && onChange({role: value.role || "user", content: e.target.value});
    }

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.style.height = '0px';
            contentRef.current.style.height = contentRef.current.scrollHeight + "px";
        }
    }, [value.content])

    return <>
        <div className="flex gap-2 hover:bg-base-200 p-2 group items-center rounded-box">
            <div className="flex-none w-20">
                <button className={`uppercase btn btn-xs ${value.role === "user" ? "btn-accent" : ""}`}
                        onClick={changeRole}>
                    {value?.role}
                </button>
            </div>
            <label className="form-control flex-auto">
                <textarea
                    className="textarea textarea-ghost h-7 resize-none"
                    placeholder={placeholder}
                    onChange={changeContent}
                    ref={contentRef}
                    value={value?.content}/>
            </label>
            <div className="flex-none invisible group-hover:visible">
                <button onClick={() => onRemove && onRemove()}>
                    <TbCircleMinus className="h-5 w-5"/>
                </button>
            </div>
        </div>
        <div className="divider"></div>
    </>;
};

export default Message;