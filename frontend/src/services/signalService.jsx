import axios from "axios";
import { FETCH_SIGNALS_URL } from "../constants/apiConstants";
/**
 * signalService.js
 *
 * Provides a function to fetch available signals from the backend.
 * Signals are sorted alphabetically by their description.
 */

export const fetchSignals = async () => {
    try {
        const response = await axios.get(FETCH_SIGNALS_URL);
        // console.log("Signals fetched:", response.data.signals);
        return response.data.signals.sort((a, b) => a.signal_description.localeCompare(b.signal_description));
    } catch (error) {
        console.error("Error fetching signals:", error);
        return [];
    }
};
