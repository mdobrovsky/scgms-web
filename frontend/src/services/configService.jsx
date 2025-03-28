import axios from "axios";
import {
    FETCH_CHAIN_FILTERS_URL,
    FETCH_FILTERS_URL,
    LOAD_CONFIGURATION_URL,
    SAVE_CONFIGURATION_URL
} from "../constants/apiConstants.jsx";

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

export const loadConfiguration = async (file) => {
    try {
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("file_name", file.name);
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

export const fetchChainFilters = async () => {
    try {
        const response = await axios.get(FETCH_CHAIN_FILTERS_URL);
        return response.data.filters;
    } catch (error) {
        console.error("Error fetching filters:", error);
        return [];
    }
};