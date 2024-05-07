import {TbFolder, TbTrash} from "react-icons/tb";
import {Rating} from "./Rating.tsx";
import {useRef, useState} from "react";
import {HistoricalRecord, useHistory} from "../HistoryContext.tsx";

type onRecordSelected = (rec: HistoricalRecord) => void;

export const projectName = (p: string) => p === "" ? "General" : p

const ProjectHistory = ({
                            project,
                            records,
                            isOpen = false,
                            onRecordSelected,
                            deleteProject,
                            deleteRecord
                        }: {
    project: string,
    records: HistoricalRecord[],
    isOpen: boolean,
    onRecordSelected: onRecordSelected
    deleteRecord: (record: HistoricalRecord) => void
    deleteProject: (project: string) => void
}) => {

    const history = useHistory()

    return <li>
        <details open={isOpen}>
            <summary>
                <TbFolder/>{projectName(project)}
                <button className="btn btn-ghost btn-circle btn-sm"
                        onClick={() => deleteProject(project)}>
                    <TbTrash className="text-neutral-content"/>
                </button>
            </summary>
            <div>
                <table className="table table-xs">
                    <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Model</th>
                        <th>Temperature</th>
                        <th className="tooltip tooltip-top" data-tip="time to first token">TTFT</th>
                        <th>Latency</th>
                        <th>Rating</th>
                        <th>Input tokens</th>
                        <th>Output tokens</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {records.map((record, i) => {
                        // We need to check if the timestamp is a string or a Date object because of the JSON serialization
                        // noinspection SuspiciousTypeOfGuard
                        const ts = !(record.timestamp instanceof Date) ? new Date(record.timestamp) : record.timestamp
                        return <tr key={i} className="cursor-pointer"
                                   onClick={() => onRecordSelected(record)}>
                            <td>{ts.toLocaleString()}</td>
                            <td>
                                <span
                                    className="badge badge-sm badge-ghost mr-1">{record.parameters.model?.vendor}</span>
                                <span className="badge badge-sm mr-3">{record.parameters.model?.type}</span>
                                {record.parameters.model!.name}</td>
                            <td>{record.parameters.temperature}</td>
                            <td>{record.time_to_first_token / 1000}s</td>
                            <td>{record.time_to_last_token / 1000}s</td>
                            <td>
                                <Rating value={record.rating}
                                        onChange={(rating) => {
                                            history.updateRecord({...record, rating})
                                        }}/>
                            </td>
                            <td>{record.input_tokens}
                            </td>
                            <td>{record.output_tokens}</td>
                            <td>
                                <button className="btn btn-ghost btn-circle btn-xs"
                                        onClick={() => deleteRecord(record)}>
                                    <TbTrash className="text-neutral-content"/>
                                </button>
                            </td>
                        </tr>
                    })}
                    </tbody>
                </table>
            </div>
        </details>
    </li>
}

export const HistoricalBrowser = ({onRecordSelected}: {
    onRecordSelected: onRecordSelected
}) => {
    const history = useHistory()

    // group by project
    const projects = history.records.reduce((acc, record) => {
        if (record.parameters.project) {
            if (!acc[record.parameters.project]) {
                acc[record.parameters.project] = []
            }
            acc[record.parameters.project].push(record)
        } else {
            if (!acc[""]) {
                acc[""] = []
            }
            acc[""].push(record)
        }
        return acc
    }, {} as Record<string, HistoricalRecord[]>)

    const modal = useRef<HTMLDialogElement>(null);
    const [deleteText, setDeleteText] = useState("")
    const [deleteRecords, setDeleteRecords] = useState<HistoricalRecord[]>([])

    const deleteRecord = (record: HistoricalRecord) => {
        // We need to check if the timestamp is a string or a Date object because of the JSON serialization
        // noinspection SuspiciousTypeOfGuard
        const ts = !(record.timestamp instanceof Date) ? new Date(record.timestamp) : record.timestamp
        setDeleteText(`record: ${ts.toLocaleString()} (${projectName(record.parameters.project || "")})`)
        setDeleteRecords([record])
        modal.current?.showModal()
    }

    const deleteProject = (project: string) => {
        setDeleteText(`project "${projectName(project)}"`)
        setDeleteRecords(projects[project])
        modal.current?.showModal()
    }


    return <>
        <ul className="menu menu-xs w-full">
            {Object.keys(projects).map((project) => {
                return <ProjectHistory
                    key={project}
                    project={project}
                    records={projects[project]}
                    isOpen={project === ""}
                    onRecordSelected={onRecordSelected}
                    deleteRecord={deleteRecord}
                    deleteProject={deleteProject}
                />
            })}
        </ul>
        <dialog className="modal" ref={modal}>
            <div className="modal-box">
                <h3 className="font-bold text-lg">Are you sure?</h3>
                <p className="py-4">Are you sure you want to delete {deleteText}?</p>
                <div className="modal-action">
                    <form method="dialog">
                        <button className="btn btn-error mr-2"
                                onClick={() => history.deleteRecords(deleteRecords)}>Delete
                        </button>
                        <button className="btn btn-primary" onClick={() => setDeleteRecords([])}>Close</button>
                    </form>
                </div>
            </div>
        </dialog>
    </>
}
