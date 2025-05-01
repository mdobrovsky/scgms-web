import axios from "axios";
import { STOP_OPTIMIZATION_URL, FETCH_SOLVER_PROGRESS_URL, SOLVE_URL } from "../constants/apiConstants";

export const solve = async (filterIndices, solverId, maxGenerations, populationSize, parameterNames) => {
    try {
        const response = await axios.post(SOLVE_URL, {
            filter_indices: filterIndices,
            solver_id: solverId,
            max_generations: maxGenerations,
            population_size: populationSize,
            parameter_names: parameterNames
        });
        console.log("Result:", response.data);
        return response.data.result;
    } catch (error) {
        console.error("Error optimizing:", error);
        return [];
    }
};

export const stopOptimization = async () => {
    try {
        const response = await axios.get(STOP_OPTIMIZATION_URL);
        return response.data.result;
    } catch (error) {
        console.error("Error stopping optimization:", error);
        return "1";
    }
};

export const fetchSolverProgress = async () => {
    try {
        const response = await axios.get(FETCH_SOLVER_PROGRESS_URL);
        return response.data.progress;
    } catch (error) {
        console.error("Error fetching solver progress:", error);
        return [];
    }
}
