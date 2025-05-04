import axios from "axios";
import { FETCH_MODELS_URL } from "../constants/apiConstants";
/**
 * modelService.js
 *
 * Fetches available models from the backend API.
 * Returns the models sorted alphabetically by their description.
 */

export const fetchModels = async () => {
    try {
        const response = await axios.get(FETCH_MODELS_URL);
        return response.data.models.sort((a, b) => a.description.localeCompare(b.description));
    } catch (error) {
        console.error("Error fetching models:", error);
        return [];
    }
};
