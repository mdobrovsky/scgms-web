import axios from "axios";
import {
    EXECUTE_CONFIGURATION_URL,
    FETCH_CHAIN_FILTERS_URL,
    FETCH_FILTERS_URL, FETCH_LOGS_URL, FETCH_SVGS_URL, IMPORT_CSV_FILES_URL, INIT_CONFIGURATION_URL,
    LOAD_CONFIGURATION_URL,
    SAVE_CONFIGURATION_URL, STOP_SIMULATION_URL
} from "../constants/apiConstants.jsx";

/**
 * configService.js
 *
 * Provides functions for interacting with the backend configuration API.
 * Includes operations for initializing, executing, stopping simulations,
 * saving/loading configurations, importing CSV files, and retrieving logs/SVGs.
 */

export const initConfiguration = async () => {
    try {
        const response = await axios.get(INIT_CONFIGURATION_URL);
        return response.data.result;
    } catch (error) {
        console.error("Error initializing configuration:", error);
        return "1";
    }
}

export const executeConfiguration = async () => {
    try {
        const response = await axios.get(EXECUTE_CONFIGURATION_URL);
        return response.data.result;
    } catch (error) {
        console.error("Error executing configuration:", error);
        return "1";
    }
}

export const stopSimulation = async () => {
    try {
        const response = await axios.get(STOP_SIMULATION_URL);
        return response.data.result;
    } catch (error) {
        console.error("Error stopping simulation:", error);
        return "1";
    }
}

export const fetchSvgs = async () => {
    try{
        const response = await axios.get(FETCH_SVGS_URL);
        return response.data.svgs;
    } catch (error) {
        console.error("Error fetching svgs:", error);
        return [];
    }
}

export const fetchLogs = async () => {
    try{
        const response = await axios.get(FETCH_LOGS_URL);
        return response.data.logs;
    } catch (error) {
        console.error("Error fetching logs:", error);
        return [];
    }
}
export const saveConfiguration = async (configFileName) => {
    try {
        const response = await axios.post(
            SAVE_CONFIGURATION_URL
            , {
                file_name: configFileName
            }
            , {
                responseType: 'blob',
            });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${configFileName}.ini`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (error) {
        console.error("Error downloading configuration:", error);
    }
}

export const loadConfiguration = async (file, csvFiles) => {
    try {
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("file_name", file.name);
        if (csvFiles && csvFiles.length > 0) {
            for (let i = 0; i < csvFiles.length; i++) {
                formData.append(`csv_files[${i}]`, csvFiles[i]);
                formData.append(`csv_names[${i}]`, csvFiles[i].name);
            }

        }

        const response = await axios.post(
            LOAD_CONFIGURATION_URL,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        console.log("Server response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error uploading file:", error);
    }

}

export const importCsvFiles = async (csvFiles) => {
    try {
        if (!csvFiles || csvFiles.length === 0) return;

        const formData = new FormData();
        for (let i = 0; i < csvFiles.length; i++) {
            formData.append(`csv_files[${i}]`, csvFiles[i]);
            formData.append(`csv_names[${i}]`, csvFiles[i].name);
        }

        const response = await axios.post(
            IMPORT_CSV_FILES_URL,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        // console.log("Server response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error uploading file:", error);
    }
}

export const fetchChainFilters = async () => {
    try {
        const response = await axios.get(FETCH_CHAIN_FILTERS_URL);
        return response.data.filters;
    } catch (error) {
        console.error("Error fetching filters:", error);
        return [];
    }
};