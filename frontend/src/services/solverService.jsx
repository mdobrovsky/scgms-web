import axios from "axios";
import { FETCH_SOLVERS_URL } from "../constants/apiConstants";

export const fetchSolvers = async () => {
    try {
        const response = await axios.get(FETCH_SOLVERS_URL);
        return response.data.solvers.sort((a, b) => a.description.localeCompare(b.description));
    } catch (error) {
        console.error("Error fetching solvers:", error);
        return [];
    }
};
