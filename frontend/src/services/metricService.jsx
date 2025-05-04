import axios from "axios";
import { FETCH_METRICS_URL } from "../constants/apiConstants";
/**
 * metricsService.js
 *
 * Provides a function to fetch available metrics from the backend API.
 * The fetched metrics are sorted alphabetically by their description.
 */
export const fetchMetrics = async () => {
    try {
        const response = await axios.get(FETCH_METRICS_URL);
        return response.data.metrics.sort((a, b) => a.description.localeCompare(b.description));
    } catch (error) {
        console.error("Error fetching metrics:", error);
        return [];
    }
};
