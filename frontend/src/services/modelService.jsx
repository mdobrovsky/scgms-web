import axios from "axios";
import { FETCH_MODELS_URL } from "../constants/apiConstants";

export const fetchModels = async () => {
    try {
        const response = await axios.get(FETCH_MODELS_URL);
        return response.data.models.sort((a, b) => a.description.localeCompare(b.description));
    } catch (error) {
        console.error("Error fetching models:", error);
        return [];
    }
};
