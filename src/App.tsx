import './App.css';
import Chat from "./Chat.js";
import {HistoricalBrowser} from "./components/HistoricalBrowser.tsx";
import {HistoricalRecord} from "./HistoryContext.tsx";
import {useState} from "react";
import {TbHistory, TbHistoryToggle, TbMoon, TbSandbox, TbSun} from "react-icons/tb";
import Completions from "./Completions.tsx";

function App() {
    const [showHistory, setShowHistory] = useState(false);
    const [toggleChatCompletions, setToggleChatCompletions] = useState(true);

    const [chatProps, setChatProps] = useState({})
    const [completionProps, setCompletionProps] = useState({})

    const recoverRecord = (record: HistoricalRecord) => {
        if (record.parameters.model?.type === "chat") {
            setToggleChatCompletions(true)
            setChatProps({systemPrompt: record.systemPrompt, messages: record.messages, parameters: record.parameters})
        } else {
            setToggleChatCompletions(false)
            setCompletionProps({prompt: record.prompt, parameters: record.parameters})
        }
    }
    return <div className="App flex h-screen flex-col p-3">
        <div className="navbar bg-base-100 gap-2 mb-3 shadow-md rounded-box">
            <div className="flex-1">
                <a className="btn btn-ghost text-xl"><TbSandbox/> LLM Playground</a>
            </div>
            <div className="flex-none">
                <ul className="menu menu-horizontal px-1">
                    <li><a onClick={() => setToggleChatCompletions(true)}
                           className={toggleChatCompletions ? "active" : ""}>Chat</a></li>
                    <li><a onClick={() => setToggleChatCompletions(false)}
                           className={!toggleChatCompletions ? "active" : ""}>Completions</a></li>
                </ul>
            </div>
            <label className="flex-none swap swap-rotate">
                <input type="checkbox" onChange={() => setShowHistory(prev => !prev)}/>
                <TbHistory className="swap-off w-7 h-7"/>
                <TbHistoryToggle className="swap-on  w-7 h-7"/>
            </label>
            <label className="swap swap-rotate">

                {/* this hidden checkbox controls the state */}
                <input type="checkbox" className="theme-controller" value="light"/>

                {/* sun icon */}
                <TbSun className="swap-off fill-current w-7 h-7"/>
                <TbMoon className="swap-on fill-current w-7 h-7"/>
            </label>
        </div>

        {toggleChatCompletions ? <Chat {...chatProps}/> : <Completions {...completionProps}/>}

        <div
            className={`border-t-2 border-base-200 transition-all duration-500 ease-in-out overflow-auto ${showHistory ? 'max-h-96' : 'max-h-0'}`}>
            <HistoricalBrowser
                onRecordSelected={recoverRecord}
            />
        </div>
    </div>;
}

export default App;
