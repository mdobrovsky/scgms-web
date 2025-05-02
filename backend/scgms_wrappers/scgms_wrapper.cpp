#include <iostream>
#include <string>
#include <sstream>
#include <utility>
#include <vector>
#include <mutex>
#include <thread>
#include <chrono>


#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <pybind11/stl_bind.h>


#include "../scgms-release/common/scgms/rtl/scgmsLib.h"
#include "../scgms-release/common/scgms/rtl/AlignmentAllocator.h"
#include "../scgms-release/common/scgms/rtl/ApproxLib.h"
#include "../scgms-release/common/scgms/rtl/Common_Calculated_Signal.h"
#include "../scgms-release/common/scgms/rtl/DbLib.h"
#include "../scgms-release/common/scgms/rtl/DeviceLib.h"
#include "../scgms-release/common/scgms/rtl/Dynamic_Library.h"
#include "../scgms-release/common/scgms/rtl/FilesystemLib.h"
#include "../scgms-release/common/scgms/rtl/FilterLib.h"
#include "../scgms-release/common/scgms/rtl/guid.h"
#include "../scgms-release/common/scgms/rtl/hresult.h"
#include "../scgms-release/common/scgms/rtl/manufactory.h"
#include "../scgms-release/common/scgms/rtl/ModelsLib.h"
#include "../scgms-release/common/scgms/rtl/rattime.h"
#include "../scgms-release/common/scgms/rtl/referencedImpl.h"
#include "../scgms-release/common/scgms/rtl/SolverLib.h"
#include "../scgms-release/common/scgms/rtl/UILib.h"
#include "../scgms-release/common/scgms/utils/string_utils.h"

// constant strings for success and failure of the operation
const std::string SUCCESS = "0";
const std::string FAIL = "1";


// structures for frontend representation of filters, models, solvers, metrics and signals
struct FilterParameter {
    std::string parameter_type;
    std::string ui_parameter_name;
    std::string config_parameter_name;
    std::string ui_parameter_tooltip;
    std::string default_value;
};

struct FilterInfo {
    std::string id;
    int flags;
    std::string description;
    int parameters_count;
    std::vector<FilterParameter> parameters;
};

struct SignalInfo {
    uint32_t fill_color;
    std::string id;
    int mark;
    std::string signal_description;
    uint32_t stroke_color;
    int stroke_pattern;
    std::string unit_description;
    int unit_id;
    double value_scale;
    int visualization;
};

struct ModelInfo {
    std::string id;
    std::string flags;
    std::string description;
    std::string db_table_name;
    size_t number_of_parameters;
    size_t number_of_segment_specific_parameters;
    std::vector<std::string> parameter_types;
    std::vector<std::string> parameter_ui_names;
    std::vector<std::string> parameter_db_column_names;
    std::vector<double> lower_bound;
    std::vector<double> default_values;
    std::vector<double> upper_bound;
    size_t number_of_calculated_signals;
    std::vector<std::string> calculated_signal_ids;
    std::vector<std::string> reference_signal_ids;
};

struct SolverInfo {
    std::string id;
    std::string description;
    bool specialized;
    size_t specialized_count;
    std::vector<std::string> specialized_models;
};

struct MetricInfo {
    std::string id;
    std::string description;
};

struct SvgInfo {
    std::string id;
    std::string name;
    std::string svg_str;
};

struct SolverProgressInfo {
    std::string current_progress;
    std::string max_progress;
    std::string best_metric;
    std::string status;
};


// global variables
// Flag indicating whether optimization is currently running
std::atomic<bool> optimizing_flag{true};
// Structure tracking solver progress
solver::TSolver_Progress Global_Progress = solver::Null_Solver_Progress;
// Executor object that runs the entire filter chain
scgms::SFilter_Executor Global_Filter_Executor;
// Filter chain configuration
std::optional<scgms::SPersistent_Filter_Chain_Configuration> chain_configuration;
// Container for potential error messages produced during optimization
refcnt::Swstr_list solver_error_description;
// Drawing interface for SVG output from the drawing filter
scgms::SDrawing_Filter_Inspection_v2 insp_draw;
// Log interfacce for textual log output from the log filter
scgms::SLog_Filter_Inspection insp_log;
// Dimensions of the SVG output from the drawing_v2 filter
int drawing_v2_width;
int drawing_v2_height;
// Mutex to synchronize access to drawing outputs
std::mutex drawing_mutex;
// Thread for monitoring output updates
std::thread monitor_thread;
// Flag to signal the monitor thread to stop
std::atomic<bool> stop_monitor_thread{false};
// Current value of logical time used by drawing filter
ULONG current_clock = 0;
// Collected SVG outputs generated during simulation
std::vector<SvgInfo> svgs;
// Collected textual log lines during simulation
std::vector<std::string> log_lines;
static std::vector<std::wstring> wide_parameter_names;
std::thread solver_thread;
HRESULT solver_hr;

/**
 * Convert a string to a NParameter_Type enum value.
 * @param type Parameter type as a string
 * @return NParameter_Type enum value
 */
scgms::NParameter_Type StringToParameterType(const std::string &type) {
    if (type == "ptNull") return scgms::NParameter_Type::ptNull;
    if (type == "ptWChar_Array") return scgms::NParameter_Type::ptWChar_Array;
    if (type == "ptInt64_Array") return scgms::NParameter_Type::ptInt64_Array;
    if (type == "ptDouble") return scgms::NParameter_Type::ptDouble;
    if (type == "ptRatTime") return scgms::NParameter_Type::ptRatTime;
    if (type == "ptInt64") return scgms::NParameter_Type::ptInt64;
    if (type == "ptBool") return scgms::NParameter_Type::ptBool;
    if (type == "ptSignal_Model_Id") return scgms::NParameter_Type::ptSignal_Model_Id;
    if (type == "ptDiscrete_Model_Id") return scgms::NParameter_Type::ptDiscrete_Model_Id;
    if (type == "ptMetric_Id") return scgms::NParameter_Type::ptMetric_Id;
    if (type == "ptSolver_Id") return scgms::NParameter_Type::ptSolver_Id;
    if (type == "ptModel_Produced_Signal_Id") return scgms::NParameter_Type::ptModel_Produced_Signal_Id;
    if (type == "ptSignal_Id") return scgms::NParameter_Type::ptSignal_Id;
    if (type == "ptDouble_Array") return scgms::NParameter_Type::ptDouble_Array;
    if (type == "ptSubject_Id") return scgms::NParameter_Type::ptSubject_Id;
    if (type == "ptInvalid") return scgms::NParameter_Type::ptInvalid;
    return scgms::NParameter_Type::ptInvalid;
}

/**
 * Convert a NParameter_Type enum value to a string.
 * @param type Parameter type as an enum value
 * @return String representation of the parameter type
 */
std::wstring ParameterTypeToString(scgms::NParameter_Type type) {
    switch (type) {
        case scgms::NParameter_Type::ptNull:
            return L"ptNull";
        case scgms::NParameter_Type::ptWChar_Array:
            return L"ptWChar_Array";
        case scgms::NParameter_Type::ptInt64_Array:
            return L"ptInt64_Array";
        case scgms::NParameter_Type::ptDouble:
            return L"ptDouble";
        case scgms::NParameter_Type::ptRatTime:
            return L"ptRatTime";
        case scgms::NParameter_Type::ptInt64:
            return L"ptInt64";
        case scgms::NParameter_Type::ptBool:
            return L"ptBool";
        case scgms::NParameter_Type::ptSignal_Model_Id:
            return L"ptSignal_Model_Id";
        case scgms::NParameter_Type::ptDiscrete_Model_Id:
            return L"ptDiscrete_Model_Id";
        case scgms::NParameter_Type::ptMetric_Id:
            return L"ptMetric_Id";
        case scgms::NParameter_Type::ptSolver_Id:
            return L"ptSolver_Id";
        case scgms::NParameter_Type::ptModel_Produced_Signal_Id:
            return L"ptModel_Produced_Signal_Id";
        case scgms::NParameter_Type::ptSignal_Id:
            return L"ptSignal_Id";
        case scgms::NParameter_Type::ptDouble_Array:
            return L"ptDouble_Array";
        case scgms::NParameter_Type::ptSubject_Id:
            return L"ptSubject_Id";
        case scgms::NParameter_Type::ptInvalid:
            return L"ptInvalid";
        default:
            return L"Unknown";
    }
}

/**
 * Get the default value for a parameter type.
 * @param type Parameter type as an enum value
 * @return Default value for the parameter type as a string
 */
std::string get_parameter_default_value(const scgms::NParameter_Type type) {
    switch (type) {
        case scgms::NParameter_Type::ptWChar_Array:
            return "";
        case scgms::NParameter_Type::ptInt64_Array:
            return "";
        case scgms::NParameter_Type::ptDouble:
            return "0.0";
        case scgms::NParameter_Type::ptRatTime:
        case scgms::NParameter_Type::ptInt64:
            return "0";
        case scgms::NParameter_Type::ptBool:
            return "false";
        case scgms::NParameter_Type::ptSignal_Model_Id:
        case scgms::NParameter_Type::ptDiscrete_Model_Id:
        case scgms::NParameter_Type::ptMetric_Id:
        case scgms::NParameter_Type::ptSolver_Id:
        case scgms::NParameter_Type::ptModel_Produced_Signal_Id:
        case scgms::NParameter_Type::ptSignal_Id:
            return Narrow_WString(GUID_To_WString(Invalid_GUID));
        case scgms::NParameter_Type::ptDouble_Array:
            return "";
        case scgms::NParameter_Type::ptSubject_Id:
            return "";
        case scgms::NParameter_Type::ptInvalid:
            return "";
        default:
            break;
    }
    return "";
}

/**
 * Get the value of a filter parameter.
 * @param parameter Filter parameter
 * @return Value of the parameter as a string
 */
std::string get_parameter_value(scgms::SFilter_Parameter parameter) {
    scgms::NParameter_Type type;
    HRESULT res = parameter->Get_Type(&type);
    HRESULT rc;
    switch (type) {
        case scgms::NParameter_Type::ptWChar_Array:
        case scgms::NParameter_Type::ptDouble_Array:
            return Narrow_WString(parameter.as_wstring(rc, true));
        case scgms::NParameter_Type::ptInt64_Array:
            return "";
        case scgms::NParameter_Type::ptDouble:
        case scgms::NParameter_Type::ptRatTime:
            return dbl_2_str(parameter.as_double(rc));
        case scgms::NParameter_Type::ptInt64:
            return std::to_string(parameter.as_int(rc));
        case scgms::NParameter_Type::ptBool:
            return parameter.as_bool(rc) ? "true" : "false";
        case scgms::NParameter_Type::ptSignal_Model_Id:
        case scgms::NParameter_Type::ptDiscrete_Model_Id:
        case scgms::NParameter_Type::ptMetric_Id:
        case scgms::NParameter_Type::ptSolver_Id:
        case scgms::NParameter_Type::ptModel_Produced_Signal_Id:
        case scgms::NParameter_Type::ptSignal_Id:
            return Narrow_WString(GUID_To_WString(parameter.as_guid(rc)));
        case scgms::NParameter_Type::ptSubject_Id:
            return "";
        case scgms::NParameter_Type::ptInvalid:
            return "";
        default:
            break;
    }
    return "";
}

/**
 *
 * @param desc Metric descriptor
 * @return MetricInfo structure for frontend representation
 */
MetricInfo convert_metric_descriptor(const scgms::TMetric_Descriptor &desc) {
    MetricInfo metric;
    metric.id = Narrow_WString(GUID_To_WString(desc.id));
    metric.description = Narrow_WString(desc.description);
    return metric;
}

/**
 *
 * @param desc Solver descriptor
 * @return SolverInfo structure for frontend representation
 */
SolverInfo convert_solver_descriptor(const scgms::TSolver_Descriptor &desc) {
    SolverInfo solver;
    solver.id = Narrow_WString(GUID_To_WString(desc.id));
    solver.description = Narrow_WString(desc.description);
    solver.specialized = desc.specialized;
    solver.specialized_count = desc.specialized_count;
    for (size_t i = 0; i < desc.specialized_count; ++i) {
        solver.specialized_models.push_back(Narrow_WString(GUID_To_WString(desc.specialized_models[i])));
    }
    return solver;
}

/**
 * Convert a signal descriptor to a SignalInfo structure.
 * @param desc Signal descriptor
 * @return SignalInfo structure for frontend representation
 */
SignalInfo convert_signal_descriptor(const scgms::TSignal_Descriptor &desc) {
    return SignalInfo{
        desc.fill_color,
        Narrow_WString(GUID_To_WString(desc.id)),
        static_cast<int>(desc.mark),
        desc.signal_description ? Narrow_WString(desc.signal_description) : "",
        desc.stroke_color,
        desc.stroke_pattern ? static_cast<int>(*desc.stroke_pattern) : -1,
        desc.unit_description ? Narrow_WString(desc.unit_description) : "",
        static_cast<int>(desc.unit_id),
        desc.value_scale,
        static_cast<int>(desc.visualization)
    };
}

/**
 * Convert a model descriptor to a ModelInfo structure.
 * @param desc Model descriptor
 * @return ModelInfo structure for frontend representation
 */
ModelInfo convert_model_descriptor(const scgms::TModel_Descriptor &desc) {
    ModelInfo model;
    model.id = Narrow_WString(GUID_To_WString(desc.id));
    switch (desc.flags) {
        case scgms::NModel_Flags::None:
            model.flags = "None";
            break;
        case scgms::NModel_Flags::Signal_Model:
            model.flags = "Signal_Model";
            break;
        case scgms::NModel_Flags::Discrete_Model:
            model.flags = "Discrete_Model";
            break;
    }
    model.description = Narrow_WString(desc.description);
    model.db_table_name = desc.db_table_name != nullptr ? Narrow_WString(desc.db_table_name) : "";
    model.number_of_parameters = desc.total_number_of_parameters;
    model.number_of_segment_specific_parameters = desc.number_of_segment_specific_parameters;
    for (size_t i = 0; i < desc.total_number_of_parameters; ++i) {
        scgms::NModel_Parameter_Value type = desc.parameter_types[i];
        switch (type) {
            case scgms::NModel_Parameter_Value::mptDouble:
                model.parameter_types.emplace_back("mptDouble");
                break;
            case scgms::NModel_Parameter_Value::mptTime:
                model.parameter_types.emplace_back("mptTime");
                break;
            case scgms::NModel_Parameter_Value::mptBool:
                model.parameter_types.emplace_back("mptBool");
                break;
        }
        model.parameter_ui_names.push_back(Narrow_WString(desc.parameter_ui_names[i]));
        if (desc.parameter_db_column_names) {
            desc.parameter_db_column_names[i] == nullptr
                ? model.parameter_db_column_names.push_back("")
                : model.parameter_db_column_names.push_back(Narrow_WString(desc.parameter_db_column_names[i]));
        } else {
            model.parameter_db_column_names.push_back("");
        }

        model.lower_bound.push_back(desc.lower_bound[i]);
        model.default_values.push_back(desc.default_values[i]);
        model.upper_bound.push_back(desc.upper_bound[i]);
    }
    model.number_of_calculated_signals = desc.number_of_calculated_signals;
    for (size_t i = 0; i < desc.number_of_calculated_signals; ++i) {
        model.calculated_signal_ids.push_back(Narrow_WString(GUID_To_WString(desc.calculated_signal_ids[i])));
        model.reference_signal_ids.push_back(Narrow_WString(GUID_To_WString(desc.reference_signal_ids[i])));
    }
    return model;
}

/**
 * Convert a filter descriptor to a FilterInfo structure.
 * @param filter Filter descriptor
 * @param info FilterInfo structure to be filled
 * @param link Optional link to the filter configuration
 */
void convert_filter_descriptor_to_info(const scgms::TFilter_Descriptor &filter, FilterInfo &info,
                                       scgms::SFilter_Configuration_Link *link = nullptr) {
    info.id = Narrow_WString(GUID_To_WString(filter.id));
    info.flags = static_cast<int>(filter.flags);
    info.description = Narrow_WString(filter.description);
    info.parameters_count = filter.parameters_count;

    for (size_t j = 0; j < filter.parameters_count; ++j) {
        FilterParameter param;
        scgms::NParameter_Type type = filter.parameter_type[j];
        param.parameter_type = Narrow_WString(ParameterTypeToString(type));
        param.ui_parameter_name = Narrow_WString(filter.ui_parameter_name[j] ? filter.ui_parameter_name[j] : L"");
        param.config_parameter_name = Narrow_WString(filter.config_parameter_name[j]
                                                         ? filter.config_parameter_name[j]
                                                         : L"");
        param.ui_parameter_tooltip = Narrow_WString(filter.ui_parameter_tooltip[j]
                                                        ? filter.ui_parameter_tooltip[j]
                                                        : L"");
        if (link == nullptr) {
            param.default_value = get_parameter_default_value(type);
        } else {
            scgms::SFilter_Parameter p = link->Resolve_Parameter(filter.config_parameter_name[j]);
            param.default_value = p ? get_parameter_value(p) : get_parameter_default_value(type);
        }
        info.parameters.push_back(param);
    }
}

/**
 * Simple function to reset the filter chain configuration.
 * @return always "0" as a string
 */
std::string reset_configuration() {
    chain_configuration.emplace();
    svgs.clear();
    return SUCCESS;
}


/**
 * Add a filter to the chain configuration.
 * @param guid_string GUID of the filter as string
 * @return "0" if the filter was added successfully, "1" otherwise
 */
std::string add_filter(const std::string &guid_string) {
    bool ok;
    scgms::SFilter_Configuration_Link link = (*chain_configuration).Add_Link
            (WString_To_GUID(Widen_String(guid_string), ok));
    return ok && link ? SUCCESS : FAIL;
}

/**
 * Save the current configuration to a file.
 * @param path Path where the configuration should be saved
 * @return "0" if the configuration was saved successfully, "1" otherwise
 */
std::string save_configuration(std::string &path) {
    refcnt::Swstr_list errors;

    HRESULT res = (*chain_configuration)->Save_To_File(Widen_String(path).c_str(), errors.get());
    errors.for_each([](const std::wstring &str) {
        std::wcerr << str << std::endl;
    });

    return Succeeded(res) ? SUCCESS : FAIL;
}

/**
 * Load a configuration from a file.
 * @param path Path to the configuration file
 * @return "0" if the configuration was loaded successfully, "1" otherwise
 */
std::string load_configuration(std::string &path) {
    refcnt::Swstr_list errors;
    chain_configuration.emplace();
    HRESULT res = (*chain_configuration)->Load_From_File(Widen_String(path).c_str(), errors.get());
    errors.for_each([](const std::wstring &str) {
        std::wcerr << str << std::endl;
    });
    return Succeeded(res) ? SUCCESS : FAIL;
}

/**
 * Remove a filter from the chain configuration.
 * @param index Index of the filter to be removed
 * @return "0" if the filter was removed successfully, "1" otherwise
 */
std::string remove_filter(int index) {
    HRESULT res = (*chain_configuration)->remove(index);
    return Succeeded(res) ? SUCCESS : FAIL;
}

/**
 * Remove all filters from the chain configuration.
 * Simply reinitializes the chain_configuration object.
 * @return "0" if the filters were removed successfully, "1" otherwise
 */
std::string remove_all_filters() {
    chain_configuration.emplace();
    HRESULT res = (*chain_configuration)->empty();
    return Succeeded(res) ? SUCCESS : FAIL;
}


/**
 * Split a string into a vector of strings based on a delimiter.
 * @param str String to be split
 * @param delimiter Delimiter character
 * @return Vector of strings obtained by splitting the input string
 */
std::vector<std::string> split(const std::string &str, char delimiter) {
    std::vector<std::string> tokens;
    std::stringstream ss(str);
    std::string token;
    while (std::getline(ss, token, delimiter)) {
        tokens.push_back(token);
    }
    return tokens;
}

/**
 * Split a string representation of a double array into a vector of doubles.
 * @param value String representation of a double array
 * @return Vector of doubles obtained by splitting the input string
 */
std::vector<double> split_double_array(const std::string &value) {
    std::vector<double> double_array;
    std::vector<std::string> tokens = split(value, ' ');
    for (const std::string &token: tokens) {
        double_array.push_back(std::stod(token));
    }
    return double_array;
}

/**
 * Get the link at a specific index in the filter chain configuration.
 * @param index Index of the link
 * @param link Reference to the SFilter_Configuration_Link object to be filled
 */
void get_link(const std::string &index, scgms::SFilter_Configuration_Link &link) {
    size_t target_index = std::stoi(index);
    size_t current_index = 0;
    (*chain_configuration).for_each([&](scgms::SFilter_Configuration_Link chain_link) {
        if (current_index == target_index) {
            link = std::move(chain_link);
        }
        current_index++;
    });
}

/**
 * Configure a filter parameter in the filter chain configuration.
 * @param index Index of the filter in the chain
 * @param id GUID of the filter
 * @param parameter_type_string String representation of the parameter type
 * @param config_parameter_name Name of the configuration parameter
 * @param value Value to be set for the parameter
 * @return "0" if the configuration was successful, "1" otherwise
 */
std::string configure_filter(
    const std::string &index,
    const std::string &id,
    const std::string &parameter_type_string,
    const std::string &config_parameter_name,
    const std::string &value
) {
    bool ok;
    scgms::SFilter_Configuration_Link link;
    get_link(index, link);
    if (!link) {
        std::cerr << "Failed to add link for filter ID: " << id << std::endl;
        return FAIL;
    }
    const scgms::NParameter_Type parameter_type = StringToParameterType(parameter_type_string);
    if (parameter_type == scgms::NParameter_Type::ptNull) {
        std::cerr << "Invalid parameter type: " << parameter_type_string << std::endl;
        return FAIL;
    }
    std::wstring config_parameter_name_wstring = Widen_String(config_parameter_name);
    const wchar_t *config_parameter_name_wchar = config_parameter_name_wstring.c_str();

    scgms::SFilter_Parameter parameter = link.Resolve_Parameter(config_parameter_name_wchar);


    if (!parameter) {
        parameter = link.Add_Parameter(parameter_type, config_parameter_name_wchar);
        if (!parameter) {
            std::cerr << "Failed to add parameter: " << config_parameter_name << std::endl;
            return FAIL;
        }
    }

    HRESULT res = E_FAIL;
    GUID guid;

    switch (parameter_type) {
        case scgms::NParameter_Type::ptRatTime:
        case scgms::NParameter_Type::ptWChar_Array:
            res = parameter.set_wstring(Widen_String(value));
            break;
        case scgms::NParameter_Type::ptInt64_Array:
            break;
        case scgms::NParameter_Type::ptDouble:
            res = parameter->Set_Double(std::stod(value));
            break;
        case scgms::NParameter_Type::ptInt64:
            res = parameter->Set_Int64(std::stoll(value));
            break;
        case scgms::NParameter_Type::ptBool:
            res = parameter->Set_Bool(value == "true");
            break;
        case scgms::NParameter_Type::ptSignal_Model_Id:
        case scgms::NParameter_Type::ptDiscrete_Model_Id:
        case scgms::NParameter_Type::ptMetric_Id:
        case scgms::NParameter_Type::ptSolver_Id:
        case scgms::NParameter_Type::ptModel_Produced_Signal_Id:
        case scgms::NParameter_Type::ptSignal_Id:
            ok = false;
            guid = WString_To_GUID(Widen_String(value), ok);
            if (!ok) {
                std::cerr << "Failed to convert value to GUID: " << value << std::endl;
                return FAIL;
            }
            res = parameter->Set_GUID(&guid);
            break;
        case scgms::NParameter_Type::ptDouble_Array:
            res = parameter.set_double_array(split_double_array(value));
            break;
        case scgms::NParameter_Type::ptSubject_Id:
            break;
        case scgms::NParameter_Type::ptInvalid:
            break;
        default:
            break;
    }
    if (!Succeeded(res)) {
        std::wcerr << L"Failed to set parameter value for: " << config_parameter_name_wchar << std::endl;
        return FAIL;
    }

    std::cout << "Successfully configured parameter: " << config_parameter_name << " with value: " << value <<
            std::endl;
    return SUCCESS;
}

/**
 * Move a filter up in the chain configuration.
 * @param index Index of the filter to be moved
 * @return "0" if the move was successful, "1" otherwise
 */
std::string move_filter_up(int index) {
    HRESULT res = (*chain_configuration)->move(index, index - 1);
    return Succeeded(res) ? SUCCESS : FAIL;
}

/**
 * Move a filter down in the chain configuration.
 * @param index Index of the filter to be moved
 * @return "0" if the move was successful, "1" otherwise
 */
std::string move_filter_down(int index) {
    HRESULT res = (*chain_configuration)->move(index, index + 1);
    return Succeeded(res) ? SUCCESS : FAIL;
}


/**
 * Get all available signals.
 * @return Vector of SignalInfo structures representing available signals
 */
std::vector<SignalInfo> get_available_signals() {
    const scgms::CSignal_Description signal_descriptors{};
    std::vector<SignalInfo> signals;
    signal_descriptors.for_each([&signals](const scgms::TSignal_Descriptor &desc) {
        signals.push_back(convert_signal_descriptor(desc));
    });
    return signals;
}


/**
 * Get all available models.
 * @return Vector of ModelInfo structures representing available models
 */
std::vector<ModelInfo> get_available_models() {
    std::vector model_desc = scgms::get_model_descriptor_list();
    std::vector<ModelInfo> models;
    for (const scgms::TModel_Descriptor &desc: model_desc) {
        ModelInfo model = convert_model_descriptor(desc);
        models.push_back(model);
    }
    return models;
}

/**
 * Get all available solvers.
 * @return Vector of SolverInfo structures representing available solvers
 */
std::vector<SolverInfo> get_available_solvers() {
    std::vector solver_desc = scgms::get_solver_descriptor_list();
    std::vector<SolverInfo> solvers;
    for (const scgms::TSolver_Descriptor &desc: solver_desc) {
        SolverInfo solver = convert_solver_descriptor(desc);
        solvers.push_back(solver);
    }
    return solvers;
}

/**
 * Get all available metrics.
 * @return Vector of MetricInfo structures representing available metrics
 */
std::vector<MetricInfo> get_available_metrics() {
    std::vector metric_desc = scgms::get_metric_descriptor_list();
    std::vector<MetricInfo> metrics;
    for (const scgms::TMetric_Descriptor &desc: metric_desc) {
        MetricInfo metric = convert_metric_descriptor(desc);
        metrics.push_back(metric);
    }
    return metrics;
}

/**
 * Get all available filters.
 * @return Vector of FilterInfo structures representing available filters
 */
std::vector<FilterInfo> get_available_filters() {
    const std::vector<scgms::TFilter_Descriptor> filter_list = scgms::get_filter_descriptor_list();
    std::vector<FilterInfo> filters;
    for (size_t i = 0; i < filter_list.size(); ++i) {
        const scgms::TFilter_Descriptor &filter = filter_list[i];
        FilterInfo info;
        convert_filter_descriptor_to_info(filter, info);
        filters.push_back(info);
    }
    return filters;
}

/**
 * Get all filters in the current chain configuration.
 * @return Vector of FilterInfo structures representing filters in the chain
 */
std::vector<FilterInfo> get_chain_filters() {
    if (!chain_configuration) {
        chain_configuration.emplace();
    }
    std::vector<FilterInfo> filters;
    (*chain_configuration).for_each([&filters](scgms::SFilter_Configuration_Link link) mutable {
        FilterInfo info;
        convert_filter_descriptor_to_info(link.descriptor(), info, &link);
        filters.push_back(info);
    });
    return filters;
}

/**
 * Get all filter descriptors in the current chain configuration.
 * @return Vector of TFilter_Descriptor structures representing filters in the chain
 */
std::vector<scgms::TFilter_Descriptor> get_chain_filter_descriptors() {
    std::vector<scgms::TFilter_Descriptor> filter_descriptors;
    (*chain_configuration).for_each([&filter_descriptors](scgms::SFilter_Configuration_Link link) mutable {
        filter_descriptors.push_back(link.descriptor());
    });
    return filter_descriptors;
}

/**
 * Updates the global drawing width and height variables based on the parameters
 * of the Drawing_Filter_v2 found in the current filter chain configuration.
 *
 * If no width/height parameter is set, defaults to 800x600 are used.
 *
 * @return always 0
 */
int update_output_filters_parameters() {
    (*chain_configuration).for_each([](scgms::SFilter_Configuration_Link link) mutable {
        // std::cout << "[CHAIN] Filter ID: " << Narrow_WChar(link.descriptor().description) << std::endl;
        if (IsEqualGUID(link.descriptor().id, scgms::IID_Drawing_Filter_v2)) {
            scgms::SFilter_Parameter width_p = link.Resolve_Parameter(link.descriptor().config_parameter_name[0]);
            std::string w_value = get_parameter_value(width_p);
            drawing_v2_width = w_value.empty()
                                   ? 800
                                   : std::stoi(w_value);
            scgms::SFilter_Parameter height_p = link.Resolve_Parameter(link.descriptor().config_parameter_name[1]);
            std::string h_value = get_parameter_value(height_p);
            drawing_v2_height = h_value.empty()
                                    ? 600
                                    : std::stoi(h_value);
            // std::cout << "Drawing filter width: " << drawing_v2_width << std::endl;
            // std::cout << "Drawing filter height: " << drawing_v2_height << std::endl;
        }
    });
    return 0;
}

/**
 * Callback invoked when a filter is created.
 * Stores drawing or log filter inspectors if recognized.
 *
 * @param filter Pointer to the created filter.
 * @param data Unused.
 * @return S_OK on success, E_FAIL if filter is null.
 */
HRESULT IfaceCalling on_filter_created_callback(scgms::IFilter *filter, void *data) {
    if (!filter) {
        std::wcerr << L"[CALLBACK] Error: Filter creation failed!" << std::endl;
        return E_FAIL;
    }

    std::wcout << L"[CALLBACK] Filter created, testing for drawing..." << std::endl;

    if (scgms::SDrawing_Filter_Inspection_v2 insp_v2 = scgms::SDrawing_Filter_Inspection_v2{scgms::SFilter{filter}}) {
        std::lock_guard<std::mutex> lock(drawing_mutex);
        insp_draw = insp_v2;
        std::wcout << L"[CALLBACK] Drawing filter recognized and stored." << std::endl;
    } else if (scgms::SLog_Filter_Inspection temp_insp_log = scgms::SLog_Filter_Inspection{scgms::SFilter{filter}}) {
        insp_log = temp_insp_log;
        std::wcout << L"[CALLBACK] Log filter recognized and stored." << std::endl;
    } else {
        std::wcout << L"[CALLBACK] Not a drawing filter, skipped." << std::endl;
    }

    return S_OK;
}

/**
 * Prepares drawing options (width, height, segments, signals) for SVG rendering
 * using the given drawing filter inspector.
 *
 * @param opts     Output structure with drawing parameters.
 * @param insp     Drawing filter inspector (v2).
 * @param segments Output container of available segment IDs.
 * @param signals  Output container of available signal IDs.
 */
void get_drawing_opts(
    scgms::TDraw_Options &opts,
    scgms::SDrawing_Filter_Inspection_v2 insp,
    refcnt::SVector_Container<uint64_t> &segments,
    refcnt::SVector_Container<GUID> &signals
) {
    // std::lock_guard<std::mutex> lock(drawing_mutex);

    opts = {};
    opts.width = drawing_v2_width;
    opts.height = drawing_v2_height;

    segments = refcnt::Create_Container_shared<uint64_t>(nullptr, nullptr);
    if (insp->Get_Available_Segments(segments.get()) == S_OK) {
        uint64_t *seg_begin = nullptr;
        uint64_t *seg_end = nullptr;

        if (segments->get(&seg_begin, &seg_end) == S_OK && seg_begin != nullptr && seg_begin != seg_end) {
            opts.segments = seg_begin;
            opts.segment_count = std::distance(seg_begin, seg_end);

            signals = refcnt::Create_Container_shared<GUID>(nullptr, nullptr);
            if (insp->Get_Available_Signals(*seg_begin, signals.get()) == S_OK) {
                GUID *sig_begin = nullptr;
                GUID *sig_end = nullptr;
                if (signals->get(&sig_begin, &sig_end) == S_OK && sig_begin != nullptr && sig_begin != sig_end) {
                    opts.in_signals = sig_begin;
                    opts.reference_signals = sig_begin;
                    opts.signal_count = std::distance(sig_begin, sig_end);
                }
            }
        }
    }
}

/**
 * Retrieve SVG drawings from the drawing filter and store them in the svgs vector.
 */
void retrieve_drawings() {
    svgs.clear();
    auto caps = refcnt::Create_Container_shared<scgms::TPlot_Descriptor>(nullptr, nullptr);

    if (insp_draw->Get_Capabilities(caps.get()) == S_OK && caps->empty() != S_OK) {
        scgms::TPlot_Descriptor *begin = nullptr;
        scgms::TPlot_Descriptor *end = nullptr;

        if (caps->get(&begin, &end) == S_OK) {
            int plot_index = 0;
            // std::wcout << L"Available plots: " << std::distance(begin, end) << std::endl;

            for (auto it = begin; it != end; ++it) {
                auto svg = refcnt::Create_Container_shared<char>(nullptr, nullptr);

                scgms::TDraw_Options opts;
                refcnt::SVector_Container<uint64_t> segments;
                refcnt::SVector_Container<GUID> signals;

                get_drawing_opts(opts, insp_draw, segments, signals);
                // std::cout << "\n=== SVG #" << plot_index << " (name: " << Narrow_WString(it->name)
                //         << ", guid: " << Narrow_WString(GUID_To_WString(it->id)) << ") ===\n";
                HRESULT res = insp_draw->Draw(&it->id, svg.get(), &opts);
                if (Succeeded(res)) {
                    auto svg_str = refcnt::Char_Container_To_String(svg.get());
                    // std::cout << svg_str << "\n";
                    SvgInfo svg_info;
                    svg_info.name = it->name ? Narrow_WString(it->name) : "Unnamed";
                    svg_info.id = Narrow_WString(GUID_To_WString(it->id));
                    svg_info.svg_str = svg_str;
                    svgs.push_back(svg_info);
                } else {
                    std::cout << "Failed to draw SVG, error description: " << Narrow_WChar(Describe_Error(res))
                            <<
                            std::endl;
                }
                ++plot_index;
            }
        }
    }
}

/**
 * Get all SVG drawings stored in the svgs vector.
 * @return Vector of SvgInfo structures representing SVG drawings
 */
std::vector<SvgInfo> get_svgs() {
    if (svgs.empty()) {
        std::cerr << "No SVGs available." << std::endl;
        return {};
    }
    std::cout << "SVGs available: " << svgs.size() << std::endl;
    return svgs;
}

/**
 * Get all log lines stored in the log_lines vector.
 * @return Vector of strings representing log lines
 */
std::vector<std::string> get_logs() {
    if (log_lines.empty()) {
        std::cerr << "No log lines available." << std::endl;
        return {};
    }
    return log_lines;
}

/**
 * Log SVGs to the console.
 */
void log_svgs_to_console() {
    std::cout << "SVGs:" << std::endl;
    auto svgs = get_svgs();
    for (const auto &svg: svgs) {
        std::cout << "SVG ID: " << svg.id << std::endl;
        std::cout << "SVG Name: " << svg.name << std::endl;
        std::cout << "SVG String: " << svg.svg_str << std::endl;
    }
}

/**
 * Retrieve log lines from the log filter and store them in the log_lines vector.
 */
void retrieve_logs() {
    std::shared_ptr<refcnt::wstr_list> lines;
    while (insp_log.pop(lines)) {
        refcnt::wstr_container **begin, **end;
        if (lines) {
            if (lines->get(&begin, &end) == S_OK) {
                for (auto iter = begin; iter != end; iter++) {
                    log_lines.push_back(Narrow_WString(WChar_Container_To_WString(*iter)));
                }
            }
        }
    }
}

/**
 * Periodically monitors output from the running filter chain.
 * Retrieves updated drawings and logs when logical clock changes.
 * Exits when stop flag is set or executor becomes invalid.
 */
void monitor_output_updates() {
    uint64_t previous_clock = 0;

    while (true) {
        if (stop_monitor_thread.load()) {
            std::cout << "[MONITOR] Stop flag detected, exiting loop." << std::endl;
            break;
        }
        std::this_thread::sleep_for(std::chrono::seconds(1)); {
            std::lock_guard<std::mutex> lock(drawing_mutex);

            // std::cout << "[DEBUG] global executor status: " << !Global_Filter_Executor << std::endl;
            if (!Global_Filter_Executor) {
                std::cout << "[DEBUG] Global executor is not set, exiting monitor thread." << std::endl;
                break;
            }
            if (insp_draw) {
                // retrieve_drawings();

                if (insp_draw->Logical_Clock(&current_clock) == S_OK) {
                    std::cout << "[DEBUG] Current logical clock: " << current_clock << std::endl;
                    if (current_clock != previous_clock) {
                        previous_clock = current_clock;
                        std::cout << "[INFO] Clock updated: " << current_clock << "\n";
                        retrieve_drawings();
                    }
                } else {
                    std::cerr << "[ERROR] Failed to get logical clock." << std::endl;
                }
            }
            if (insp_log) {
                retrieve_logs();
            }
        }
    }
}

/**
 * Execute the filter chain.
 * Updates output filters parameters, retrieves drawings and logs if needed.
 * Starts a monitor thread to periodically check for updates.
 *
 * @return "0" if execution was successful, error message otherwise
 */
std::string execute() {
    update_output_filters_parameters();
    log_lines = {};
    svgs = {};
    refcnt::Swstr_list errors;
    if (Global_Filter_Executor) {
        return SUCCESS;
    }

    // Execute the filter chain
    Global_Filter_Executor = scgms::SFilter_Executor{
        (*chain_configuration).get(),
        reinterpret_cast<scgms::TOn_Filter_Created>(on_filter_created_callback), // Callback function
        nullptr, // Callback data
        errors,
    };

    if (Global_Filter_Executor) {
        std::cout << "[EXECUTE] Filter chain execution started successfully." << std::endl;
        std::this_thread::sleep_for(std::chrono::seconds(2));
        if (insp_draw) {
            std::lock_guard<std::mutex> lock(drawing_mutex);
            std::cout << "[EXECUTE] Calling retrieve_drawings() directly..." << std::endl;
            retrieve_drawings();
        }
        if (insp_log) {
            std::cout << "[EXECUTE] Calling retrieve_logs() directly..." << std::endl;
            retrieve_logs();
        }
        if (insp_draw || insp_log) {
            std::cout << "[EXECUTE] Starting monitor thread..." << std::endl;
            stop_monitor_thread.store(false);

            monitor_thread = std::thread(monitor_output_updates);
            std::cout << "[EXECUTE] Monitor thread started." << std::endl;
        } else {
            std::cout << "[EXECUTE] Insp not set! Drawing filter not detected." << std::endl;
        }


        std::cout << "[EXECUTE] Filter chain execution completed." << std::endl;
    } else {
        std::wcerr << L"[EXECUTE] Failed to create filter executor." << std::endl;
        std::string error_message = "";
        errors.for_each([&error_message](const std::wstring &str) mutable {
            error_message += Narrow_WString(str) + "\n";
            std::wcerr << str << std::endl;
        });
        std::cout << "[EXECUTE] Errors: " << error_message << std::endl;
        return error_message;
    }
    return SUCCESS;
}


/**
 * Load the SCGMS library if not already loaded.
 * @return  "0" if the library is loaded successfully, "1" otherwise
 */
std::string load_scgms_lib() {
    if (!scgms::is_scgms_loaded()) {
        std::cerr << "SCGMS library is not loaded. Attempting to load..." << std::endl;

        std::wstring library_path = L"./scgms/libscgms.dylib";
        scgms::set_base_path(library_path);

        // scgms::set_base_path(L"/build/scgms-release/build/compiled/libscgms.so");

        if (!scgms::is_scgms_loaded()) {
            std::cerr << "Library loading failed!" << std::endl;
            return FAIL;
        }
    }

    std::cout << "SCGMS library loaded successfully." << std::endl;
    return SUCCESS;
}

/**
 * Initialize the configuration object.
 */
void init_config() {
    chain_configuration.emplace();
}

/**
 * Inject an event into the filter executor.
 * @param code Event code
 * @param signal_id Signal ID
 * @param info Event information
 * @param segment_id Segment ID
 */
void inject_event(const scgms::NDevice_Event_Code &code, const GUID &signal_id, const wchar_t *info,
                  const uint64_t segment_id) {
    if (Global_Filter_Executor) {
        scgms::UDevice_Event evt{code};
        evt.signal_id() = signal_id;
        evt.segment_id() = segment_id;
        evt.info.set(info);
        Global_Filter_Executor.Execute(std::move(evt));
    }
}

/**
 * Stop the simulation and terminate the filter executor.
 * @return "0" if the simulation was stopped successfully, "1" otherwise
 */
std::string stop_simulation() {
    stop_monitor_thread.store(true);
    std::cout << "Stopping monitor thread..." << std::endl;
    if (monitor_thread.joinable()) {
        std::cout << "[STOP] Waiting for monitor thread to finish..." << std::endl;
        monitor_thread.join();
        std::cout << "[STOP] Monitor thread joined successfully." << std::endl;
    }
    insp_draw = {};
    insp_log = {};
    current_clock = 0;

    inject_event(scgms::NDevice_Event_Code::Shut_Down, Invalid_GUID, nullptr, 0);
    HRESULT hr = Global_Filter_Executor->Terminate(TRUE);
    if (!Succeeded(hr)) {
        std::cerr << "Failed to terminate filter executor: " << Narrow_WChar(Describe_Error(hr)) << std::endl;
        return FAIL;
    }

    std::cout << "Filter executor terminated successfully." << std::endl;
    Global_Filter_Executor = {};
    return SUCCESS;
}


void print_filter_info(const FilterInfo &filter) {
    std::cout << "Filter ID: " << filter.id << std::endl;
    std::cout << "Filter Flags: " << filter.flags << std::endl;
    std::cout << "Filter Description: " << filter.description << std::endl;
    std::cout << "Filter Parameters Count: " << filter.parameters_count << std::endl;
    for (const auto &param: filter.parameters) {
        std::cout << "Parameter Type: " << param.parameter_type << std::endl;
        std::cout << "UI Parameter Name: " << param.ui_parameter_name << std::endl;
        std::cout << "Config Parameter Name: " << param.config_parameter_name << std::endl;
        std::cout << "UI Parameter Tooltip: " << param.ui_parameter_tooltip << std::endl;
        std::cout << "Default Value: " << param.default_value << std::endl;
    }
}

/**
 * Print information about all filters in the provided vector.
 * @param filters Vector of FilterInfo structures to be printed
 */
void print_filters_info(std::vector<FilterInfo> filters) {
    for (const auto &filter: filters) {
        print_filter_info(filter);
    }
}

// void convert_to_global_progress_info(solver::TSolver_Progress &progress) {
//     SolverProgressInfo info;
//     info.current_progress = std::to_string(progress.current_progress);
//     info.max_progress = std::to_string(progress.max_progress);
//     // convert best_metric to string
//     info.best_metric = std::to_string(progress.best_metric[0]);
//     info.status = progress.cancelled ? "Cancelled" : "Ongoing";
//     progress_info = info;
//     std::cout << "[PROGRESS] Current progress: " << info.current_progress << std::endl;
//     std::cout << "[PROGRESS] Max progress: " << info.max_progress << std::endl;
//     std::cout << "[PROGRESS] Best metric: " << info.best_metric << std::endl;
//     std::cout << "[PROGRESS] Status: " << info.status << std::endl;
// }

/**
 * Launches parameter optimization using the specified solver and filter configuration.
 * Converts parameter names to wide strings, starts the optimization in a background thread,
 * and tracks progress in a global progress object.
 *
 * @param filter_indices Indices of filters to optimize.
 * @param parameter_names Names of the parameters to optimize.
 * @param solver_id_str Solver GUID as a string.
 * @param population_size Population size.
 * @param max_generations Maximum number of generations.
 * @return "0" on success, or an error message on failure.
 */
std::string optimize_parameters(const std::vector<int> &filter_indices,
                                const std::vector<std::string> &parameter_names,
                                const std::string &solver_id_str,
                                int population_size,
                                int max_generations) {
    std::cout << "[OPTIMIZE] Filter indices: ";
    for (auto idx: filter_indices) std::cout << idx << " ";
    std::cout << "\n[OPTIMIZE] Parameter names: ";
    for (const auto &p: parameter_names) std::cout << p << " ";
    std::cout << "\n[OPTIMIZE] Solver ID: " << solver_id_str << "\n";
    std::cout << "[OPTIMIZE] Population size: " << population_size << "\n";
    std::cout << "[OPTIMIZE] Max generations: " << max_generations << "\n";


    bool ok;
    GUID solver_id = WString_To_GUID(Widen_String(solver_id_str), ok);
    if (!ok) return "Error: Invalid solver GUID.";

    std::shared_ptr<std::vector<size_t> > filter_indices_sized_ptr = std::make_shared<std::vector<size_t> >(
        filter_indices.begin(), filter_indices.end());

    wide_parameter_names.clear();

    auto parameter_name_ptrs_ptr = std::make_shared<std::vector<const wchar_t *> >();
    for (const auto &name: parameter_names) {
        wide_parameter_names.emplace_back(Widen_String(name));
    }
    for (const auto &wide: wide_parameter_names) {
        parameter_name_ptrs_ptr->push_back(wide.c_str());
    }

    Global_Progress = solver::TSolver_Progress{};

    std::cout << "[OPTIMIZE] Running Optimize_Parameters with:\n";
    std::cout << "- Filters: ";
    for (auto idx: filter_indices) std::cout << idx << " ";
    std::cout << "\n- Parameters: ";
    for (const auto &p: wide_parameter_names) std::wcout << p << " ";
    std::cout << "\n- Solver ID: " << solver_id_str << "\n";
    std::cout << "- Population Size: " << population_size << "\n";
    std::cout << "- Max Generations: " << max_generations << "\n";
    auto solver_id_copy = solver_id;
    std::string result = SUCCESS;
    solver_thread = std::thread(
        [
            // =
            filter_indices_sized_ptr, parameter_name_ptrs_ptr, solver_id_copy, population_size,
            max_generations
        ](solver::TSolver_Progress &progress) {
            const size_t *filter_indices_data = filter_indices_sized_ptr->data();
            const wchar_t **parameter_names_data = parameter_name_ptrs_ptr->data();
            solver_hr = scgms::Optimize_Parameters(
                (*chain_configuration),
                filter_indices_data,
                parameter_names_data,
                filter_indices_sized_ptr->size(),
                nullptr, nullptr,
                solver_id_copy,
                population_size,
                max_generations,
                nullptr, 0,
                progress,
                solver_error_description
            );
            optimizing_flag = false;

        }, std::ref(Global_Progress));
    solver_thread.detach();


    return SUCCESS;
}

/**
 * Print the progress of the solver.
 */
void print_solver_progress_loop() {
    std::cout << "[PROGRESS] Initiating monitor solving update ...\n";

    while (!Global_Progress.cancelled) {
        std::this_thread::sleep_for(std::chrono::milliseconds(1000));
    }
    std::cout << "Generation: " << Global_Progress.current_progress << " / " << Global_Progress.max_progress << "\n";
    std::cout << "Best metric: ";
    if (Global_Progress.best_metric[0] != 0) {
        std::cout << Global_Progress.best_metric[0] << "\n";
    } else {
        std::cout << "N/A\n";
    }

    std::cout << "Status: " << ("Stopped") << "\n\n";

    std::cout << "[PROGRESS] Monitoring ended.\n";
}

/**
 * Get the current progress of the solver.
 * @return SolverProgressInfo structure containing progress information
 */
SolverProgressInfo get_solver_progress_info() {
    if (Global_Progress.current_progress != 0 && Global_Progress.current_progress >= Global_Progress.max_progress) {
        Global_Progress.cancelled = true;
    }
    SolverProgressInfo info;
    info.current_progress = std::to_string(std::min(Global_Progress.current_progress, Global_Progress.max_progress));
    info.max_progress = std::to_string(Global_Progress.max_progress);
    info.best_metric = std::to_string(Global_Progress.best_metric[0]);
    info.status = Global_Progress.cancelled ? "Cancelled" : "Ongoing";

    return info;
}

/**
 * Stop the optimization process.
 * @return always "0"
 */
std::string stop_optimization() {
    if (Global_Progress.cancelled) {
        std::cout << "[STOP] Optimization already cancelled." << std::endl;
        return SUCCESS;
    }
    Global_Progress.cancelled = true;
    std::cout << "[STOP] Optimization cancelled." << std::endl;
    return SUCCESS;
}


PYBIND11_MAKE_OPAQUE(std::vector<FilterInfo>);

PYBIND11_MODULE(scgms_wrapper, m) {
    m.doc() = "SCGMS Python module"; // optional module docstring
    m.def("load_scgms_lib", &load_scgms_lib, "Loads the SCGMS library");
    m.def("init_config", &init_config, "Initializes the configuration");
    m.def("add_filter", &add_filter, "Adds a filter to the configuration");
    m.def("save_configuration", &save_configuration, "Saves the configuration to a file");
    m.def("load_configuration", &load_configuration, "Loads the configuration from a file");
    m.def("get_chain_filters", &get_chain_filters, "Returns filters in the configuration");
    m.def("configure_filter", &configure_filter, "Configures a filter in the configuration");
    m.def("remove_filter", &remove_filter, "Removes a filter from the configuration");
    m.def("move_filter_up", &move_filter_up, "Moves a filter up in the configuration");
    m.def("move_filter_down", &move_filter_down, "Moves a filter down in the configuration");
    m.def("reset_configuration", &reset_configuration, "Resets the configuration");
    m.def("execute", &execute, "Executes the filter chain");
    m.def("stop_simulation", &stop_simulation, "Stops the simulation");
    // Expose structures for working with filters
    namespace py = pybind11;
    py::class_<FilterParameter>(m, "FilterParameter")
            .def_readonly("parameter_type", &FilterParameter::parameter_type)
            .def_readonly("ui_parameter_name", &FilterParameter::ui_parameter_name)
            .def_readonly("config_parameter_name", &FilterParameter::config_parameter_name)
            .def_readonly("ui_parameter_tooltip", &FilterParameter::ui_parameter_tooltip)
            .def_readonly("default_value", &FilterParameter::default_value);

    py::class_<FilterInfo>(m, "FilterInfo")
            .def_readonly("id", &FilterInfo::id)
            .def_readonly("flags", &FilterInfo::flags)
            .def_readonly("description", &FilterInfo::description)
            .def_readonly("parameters_count", &FilterInfo::parameters_count)
            .def_readonly("parameters", &FilterInfo::parameters);

    py::bind_vector<std::vector<FilterInfo> >(m, "FilterInfoVector");
    m.def("get_available_filters", &get_available_filters, "Returns available filters");

    // Binding for SignalInfo
    py::class_<SignalInfo>(m, "SignalInfo")
            .def_readonly("fill_color", &SignalInfo::fill_color)
            .def_readonly("id", &SignalInfo::id)
            .def_readonly("mark", &SignalInfo::mark)
            .def_readonly("signal_description", &SignalInfo::signal_description)
            .def_readonly("stroke_color", &SignalInfo::stroke_color)
            .def_readonly("stroke_pattern", &SignalInfo::stroke_pattern)
            .def_readonly("unit_description", &SignalInfo::unit_description)
            .def_readonly("unit_id", &SignalInfo::unit_id)
            .def_readonly("value_scale", &SignalInfo::value_scale)
            .def_readonly("visualization", &SignalInfo::visualization);

    py::bind_vector<std::vector<SignalInfo> >(m, "SignalInfoVector");
    m.def("get_available_signals", &get_available_signals, "Returns available signals");

    // Binding for ModelInfo
    py::class_<ModelInfo>(m, "ModelInfo")
            .def_readonly("id", &ModelInfo::id)
            .def_readonly("flags", &ModelInfo::flags)
            .def_readonly("description", &ModelInfo::description)
            .def_readonly("db_table_name", &ModelInfo::db_table_name)
            .def_readonly("number_of_parameters", &ModelInfo::number_of_parameters)
            .def_readonly("number_of_segment_specific_parameters",
                          &ModelInfo::number_of_segment_specific_parameters)
            .def_readonly("parameter_types", &ModelInfo::parameter_types)
            .def_readonly("parameter_ui_names", &ModelInfo::parameter_ui_names)
            .def_readonly("parameter_db_column_names", &ModelInfo::parameter_db_column_names)
            .def_readonly("lower_bound", &ModelInfo::lower_bound)
            .def_readonly("default_values", &ModelInfo::default_values)
            .def_readonly("upper_bound", &ModelInfo::upper_bound)
            .def_readonly("number_of_calculated_signals", &ModelInfo::number_of_calculated_signals)
            .def_readonly("calculated_signal_ids", &ModelInfo::calculated_signal_ids)
            .def_readonly("reference_signal_ids", &ModelInfo::reference_signal_ids);
    py::bind_vector<std::vector<ModelInfo> >(m, "ModelInfoVector");
    m.def("get_available_models", &get_available_models, "Returns available models");

    // Binding for SolverInfo
    py::class_<SolverInfo>(m, "SolverInfo")
            .def_readonly("id", &SolverInfo::id)
            .def_readonly("description", &SolverInfo::description)
            .def_readonly("specialized", &SolverInfo::specialized)
            .def_readonly("specialized_count", &SolverInfo::specialized_count)
            .def_readonly("specialized_models", &SolverInfo::specialized_models);
    py::bind_vector<std::vector<SolverInfo> >(m, "SolverInfoVector");
    m.def("get_available_solvers", &get_available_solvers, "Returns available solvers");

    // Binding for MetricInfo
    py::class_<MetricInfo>(m, "MetricInfo")
            .def_readonly("id", &MetricInfo::id)
            .def_readonly("description", &MetricInfo::description);
    py::bind_vector<std::vector<MetricInfo> >(m, "MetricInfoVector");
    m.def("get_available_metrics", &get_available_metrics, "Returns available metrics");

    // Binding for SvgInfo
    py::class_<SvgInfo>(m, "SvgInfo")
            .def_readonly("id", &SvgInfo::id)
            .def_readonly("name", &SvgInfo::name)
            .def_readonly("svg_str", &SvgInfo::svg_str);
    py::bind_vector<std::vector<SvgInfo> >(m, "SvgInfoVector");
    m.def("get_svgs", &get_svgs, "Returns SVGs from the filter chain");
    m.def("get_logs", &get_logs, "Returns log lines from the filter chain");

    // Binding for SolverInfo
    py::class_<SolverProgressInfo>(m, "SolverProgressInfo")
            .def_readonly("current_progress", &SolverProgressInfo::current_progress)
            .def_readonly("max_progress", &SolverProgressInfo::max_progress)
            .def_readonly("best_metric", &SolverProgressInfo::best_metric)
            .def_readonly("status", &SolverProgressInfo::status);
    py::bind_vector<std::vector<SolverProgressInfo> >(m, "SolverProgressInfoVector");
    m.def("get_solver_progress_info", &get_solver_progress_info, "Returns solver progress information");

    m.def("optimize_parameters", &optimize_parameters,
          "Optimizes parameters using the specified solver and filter indices");
    m.def("stop_optimization", &stop_optimization, "Stops the optimization process");
}


#ifdef COMPILE_AS_EXECUTABLE

/**
 * Main function used only for testing the wrapper.
 * @return 0 on success, 1 on failure
 */
int main() {
    if (load_scgms_lib() != SUCCESS) {
        std::cerr << "Failed to load scgms library.\n";
        return 1;
    }


    chain_configuration.emplace();
    HRESULT res = (*chain_configuration)->Load_From_File(L"../cfg2/config.ini", nullptr);
    if (!Succeeded(res)) {
        std::cerr << "Failed to load configuration from file." << std::endl;
        return 1;
    }
    // test optimize
    std::string result = optimize_parameters(
         {8}, // filter indices
         {"Parameters"}, // parameter names
         "{1B21B62F-7C6C-4027-89BC-687D8BD32B3C}", // solver ID
         20, // population size
         100 // max generations
     );

    // loop to call and print progress
    while (true) {
        std::this_thread::sleep_for(std::chrono::milliseconds(1000));
        SolverProgressInfo progress = get_solver_progress_info();
        std::cout << "Current progress: " << progress.current_progress << std::endl;
        std::cout << "Max progress: " << progress.max_progress << std::endl;
        std::cout << "Best metric: " << progress.best_metric << std::endl;
        std::cout << "Status: " << progress.status << std::endl;
        if (progress.status == "Cancelled") {
            break;
        }
    }



    return 0;
}
#endif
