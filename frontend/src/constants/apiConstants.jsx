// apiConstants.js
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
export const FETCH_FILTERS_URL = `${API_BASE_URL}/filters/fetch`;

export const ADD_FILTER_URL = `${API_BASE_URL}/filters/add`;
export const CONFIGURE_FILTER_URL = `${API_BASE_URL}/filters/configure`;
export const INIT_CONFIGURATION_URL = `${API_BASE_URL}/config/init`;
export const SAVE_CONFIGURATION_URL = `${API_BASE_URL}/config/save`;
export const LOAD_CONFIGURATION_URL = `${API_BASE_URL}/config/load`;
export const EXECUTE_CONFIGURATION_URL = `${API_BASE_URL}/config/execute`;
export const STOP_SIMULATION_URL = `${API_BASE_URL}/config/stop`;
export const FETCH_SVGS_URL = `${API_BASE_URL}/config/fetch_svgs`;
export const FETCH_LOGS_URL = `${API_BASE_URL}/config/fetch_logs`;
export const IMPORT_CSV_FILES_URL = `${API_BASE_URL}/config/import_csv`;
export const FETCH_CHAIN_FILTERS_URL = `${API_BASE_URL}/config/fetch_filters`;
export const REMOVE_FILTER_URL = `${API_BASE_URL}/filters/remove`;
export const MOVE_FILTER_UP_URL = `${API_BASE_URL}/filters/move_up`;
export const MOVE_FILTER_DOWN_URL = `${API_BASE_URL}/filters/move_down`;
export const FETCH_SIGNALS_URL = `${API_BASE_URL}/signals/fetch`;
export const FETCH_MODELS_URL = `${API_BASE_URL}/models/fetch`;
export const FETCH_SOLVERS_URL = `${API_BASE_URL}/solvers/fetch`;
export const FETCH_METRICS_URL = `${API_BASE_URL}/metrics/fetch`;
export const SOLVE_URL = `${API_BASE_URL}/optimization/solve`;
export const FETCH_SOLVER_PROGRESS_URL = `${API_BASE_URL}/optimization/fetch_progress`;
export const STOP_OPTIMIZATION_URL = `${API_BASE_URL}/optimization/stop`;
