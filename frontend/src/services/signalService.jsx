import axios from "axios";
import { FETCH_SIGNALS_URL } from "../constants/apiConstants";

export const fetchSignals = async () => {
    try {
        const response = await axios.get(FETCH_SIGNALS_URL);
        return response.data.signals;
    } catch (error) {
        console.error("Error fetching signals:", error);
        return [];
    }
};
