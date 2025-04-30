import axios from "axios";
import {
    ADD_FILTER_URL,
    CONFIGURE_FILTER_URL,
    FETCH_FILTERS_URL, MOVE_FILTER_DOWN_URL,
    MOVE_FILTER_UP_URL,
    REMOVE_FILTER_URL
} from "../constants/apiConstants";

export const fetchFilters = async () => {
    try {
        const response = await axios.get(FETCH_FILTERS_URL);
        // return alphabetically sorted filters
        return response.data.filters.sort((a, b) => a.description.localeCompare(b.description));
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

export const moveFilterUp = async (index) => {
    try {
        const response = await axios.post(MOVE_FILTER_UP_URL, { index });
        return response.data.result;
    } catch (error) {
        console.error("Error removing filter:", error);
        return "1";
    }
};

export const moveFilterDown = async (index) => {
    try {
        const response = await axios.post(MOVE_FILTER_DOWN_URL, { index });
        return response.data.result;
    } catch (error) {
        console.error("Error removing filter:", error);
        return "1";
    }
};

export const configureFilter = async (filter) => {
    try {
        const response = await axios.post(CONFIGURE_FILTER_URL, { filter });
        return response.data.result;
    } catch (error) {
        console.error("Error configuring filter:", error);
        return "1";
    }
}
