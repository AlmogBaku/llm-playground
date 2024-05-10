import {createContext, ReactNode, useContext, useEffect, useState} from "react";

export interface Model {
    name: string
    description?: string
    type: "chat" | "completions"
    system_prompt?: boolean
    maxTokens?: number
    vendor?: string
}

export interface ModelsContextType {
    models: Model[];
    apiURL?: string;
}

const apiURL = import.meta.env.VITE_API_BASE_URL || "/api";
export const APIContext = createContext<ModelsContextType>({models: [], apiURL: apiURL})

export const APIProvider = ({children}: { children: ReactNode }) => {
    const [models, setModels] = useState<Model[]>([]);
    useEffect(() => {
        fetch(`${apiURL}/models`)
            .then((response) => response.json())
            .then((data) => {
                setModels(data)
            });
    }, []);
    return <APIContext.Provider value={{models: models, apiURL: apiURL}}>
        {children}
    </APIContext.Provider>;
};

export const useApiContext = () => {
    return useContext(APIContext);
}
