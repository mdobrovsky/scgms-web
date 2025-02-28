import axios from "axios";
import { ADD_FILTER_URL, FETCH_FILTERS_URL, REMOVE_FILTER_URL } from "../constants/apiConstants";

export const fetchFilters = async () => {
    try {
        const response = await axios.get(FETCH_FILTERS_URL);
        return response.data.filters;
    } catch (error) {
        console.error("Error fetching filters:", error);
        return [];
    }
};

export const addFilter = async (guid_string) => {
    try {
        const response = await axios.post(ADD_FILTER_URL, { guid_string });
        return response.data.result;
    } catch (error) {
        console.error("Error adding filter:", error);
        return "1";
    }
};

export const removeFilter = async (index) => {
    try {
        const response = await axios.post(REMOVE_FILTER_URL, { index });
        return response.data.result;
    } catch (error) {
        console.error("Error removing filter:", error);
        return "1";
    }
};
