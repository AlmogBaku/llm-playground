import {createContext, Dispatch, ReactNode, SetStateAction, useContext} from "react";
import {MessageType} from "./components/Message.tsx";
import {ParametersValue} from "./components/Parameters.tsx";
import {useLocalStorage} from "./LocalStorage.ts";
import {SerializedEditorState} from "lexical";

export interface HistoricalRecord {
    timestamp: Date
    systemPrompt?: string
    messages?: MessageType[]
    promptState?: SerializedEditorState
    parameters: ParametersValue
    time_to_first_token: number
    time_to_last_token: number
    rating?: number
    input_tokens?: number
    output_tokens?: number
}

class History {
    private readonly _records: HistoricalRecord[] = []
    public set_records: Dispatch<SetStateAction<HistoricalRecord[]>>

    constructor(records: HistoricalRecord[], set_records: Dispatch<SetStateAction<HistoricalRecord[]>>) {
        this._records = records
        this.set_records = set_records
    }

    get records() {
        return this.normalizeRecords(this._records)
    }

    private normalizeRecords(records: HistoricalRecord[]) {
        return records.map((r) => {
            // We need to check if the timestamp is a string or a Date object because of the JSON serialization
            // noinspection SuspiciousTypeOfGuard
            return {...r, timestamp: !(r.timestamp instanceof Date) ? new Date(r.timestamp) : r.timestamp}
        }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    }

    public addRecord(record: HistoricalRecord) {
        this.set_records((prev) => {
            return [record, ...prev]
        })
    }

    public deleteRecord(record: HistoricalRecord) {
        this.deleteRecords([record])
    }

    public deleteRecords(records: HistoricalRecord[]) {
        this.set_records((prev) => {
            return this.normalizeRecords(prev).filter((r) => {
                !records.some((d) => d.timestamp.getTime() === r.timestamp.getTime() && d.parameters.project === r.parameters.project)
            })
        })
    }

    public updateRecord(record: HistoricalRecord) {
        this.set_records((prev) => {
            return this.normalizeRecords(prev).map((r) => {
                if (r.timestamp.getTime() === record.timestamp.getTime() && r.parameters.project === record.parameters.project) {
                    return record
                }
                return r
            })
        })
    }

    public deleteProject(project: string) {
        this.set_records((prev) => {
            return prev.filter((r) => r.parameters.project !== project)
        })
    }
}


export const HistoryContext = createContext<History>(new History([], () => {
}));

export const HistoryProvider = ({children}: { children: ReactNode }) => {
    const [historicalRecords, setHistoricalRecords] = useLocalStorage<HistoricalRecord[]>("history", []);

    return <HistoryContext.Provider value={new History(historicalRecords, setHistoricalRecords)}>
        {children}
    </HistoryContext.Provider>;
};

export const useHistory = () => {
    return useContext(HistoryContext);
}
