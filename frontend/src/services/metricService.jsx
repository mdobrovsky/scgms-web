import axios from "axios";
import { FETCH_METRICS_URL } from "../constants/apiConstants";

export const fetchMetrics = async () => {
    try {
        const response = await axios.get(FETCH_METRICS_URL);
        return response.data.metrics.sort((a, b) => a.description.localeCompare(b.description));
    } catch (error) {
        console.error("Error fetching metrics:", error);
        return [];
    }
};
