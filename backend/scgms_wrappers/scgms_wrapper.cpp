#include <iostream>
#include <string>
#include <sstream>
#include <utility>
#include <vector>


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


solver::TSolver_Progress Global_Progress = solver::Null_Solver_Progress; // so that we can cancel from sigint
scgms::SFilter_Executor Global_Filter_Executor;

scgms::SPersistent_Filter_Chain_Configuration chain_configuration;
scgms::SDrawing_Filter_Inspection_v2 insp_draw;
scgms::SLog_Filter_Inspection insp_log;
int drawing_v2_width;
int drawing_v2_height;
std::mutex drawing_mutex;
std::thread monitor_thread;
std::atomic<bool> stop_monitor_thread{false};
std::vector<std::string> log_lines;
ULONG current_clock = 0;


// structures for filter info
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

std::vector<SvgInfo> svgs;


MetricInfo convert_metric_descriptor(const scgms::TMetric_Descriptor &desc) {
    MetricInfo metric;
    metric.id = Narrow_WString(GUID_To_WString(desc.id));
    metric.description = Narrow_WString(desc.description);
    return metric;
}

std::string reset_configuration() {
    chain_configuration = scgms::SPersistent_Filter_Chain_Configuration();
    svgs.clear();
    return "0";
}

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
    return scgms::NParameter_Type::ptInvalid; // Default case for unknown strings
}

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

std::string add_filter(const std::string &guid_string) {
    bool ok;
    scgms::SFilter_Configuration_Link link = chain_configuration.Add_Link
            (WString_To_GUID(Widen_String(guid_string), ok));
    return ok ? "0" : "1";
}

std::string save_configuration(std::string &path) {
    refcnt::Swstr_list errors;

    HRESULT res = chain_configuration->Save_To_File(Widen_String(path).c_str(), errors.get());
    errors.for_each([](const std::wstring &str) {
        std::wcerr << str << std::endl;
    });

    return Succeeded(res) ? "0" : "1";
}

std::string load_configuration(std::string &path) {
    refcnt::Swstr_list errors;

    HRESULT res = chain_configuration->Load_From_File(Widen_String(path).c_str(), errors.get());
    errors.for_each([](const std::wstring &str) {
        std::wcerr << str << std::endl;
    });

    return Succeeded(res) ? "0" : "1";
}


std::string remove_filter(int index) {
    HRESULT res = chain_configuration->remove(index);
    return Succeeded(res) ? "0" : "1";
}


std::string remove_all_filters() {
    chain_configuration = scgms::SPersistent_Filter_Chain_Configuration();

    HRESULT res = chain_configuration->empty();
    return Succeeded(res) ? "0" : "1";
}

std::string get_parameter_default_value(const scgms::NParameter_Type type) {
    switch (type) {
        case scgms::NParameter_Type::ptWChar_Array:
            return "";
        case scgms::NParameter_Type::ptInt64_Array: // TODO
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
            return ""; // TODO
        case scgms::NParameter_Type::ptSubject_Id:
            return ""; // TODO
        case scgms::NParameter_Type::ptInvalid:
            return "";
        default:
            break;
    }
    return "";
}

std::string get_parameter_value(scgms::SFilter_Parameter parameter) {
    // std::cout << "is nullptr: " << (parameter == nullptr) << std::endl;
    scgms::NParameter_Type type;
    HRESULT res = parameter->Get_Type(&type);
    HRESULT rc;
    switch (type) {
        case scgms::NParameter_Type::ptWChar_Array:
        case scgms::NParameter_Type::ptDouble_Array:
            // std::wcout << "Getting wstring: " << parameter.as_wstring(rc, true) << std::endl;
            return Narrow_WString(parameter.as_wstring(rc, true));
        case scgms::NParameter_Type::ptInt64_Array: // TODO
            return "";
        case scgms::NParameter_Type::ptDouble:
        case scgms::NParameter_Type::ptRatTime:
            // std::cout << "Getting double: " << parameter.as_double(rc) << std::endl;
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
            return ""; // TODO
        case scgms::NParameter_Type::ptInvalid:
            return "";
        default:
            break;
    }
    return "";
}

std::vector<std::string> split(const std::string &str, char delimiter) {
    std::vector<std::string> tokens;
    std::stringstream ss(str);
    std::string token;

    while (std::getline(ss, token, delimiter)) {
        tokens.push_back(token);
    }

    return tokens;
}

std::vector<double> split_double_array(const std::string &value) {
    std::vector<double> double_array;
    std::vector<std::string> tokens = split(value, ' ');
    for (const std::string &token: tokens) {
        double_array.push_back(std::stod(token));
    }
    return double_array;
}


void get_link(const std::string &index, scgms::SFilter_Configuration_Link &link) {
    size_t target_index = std::stoi(index);
    size_t current_index = 0;
    chain_configuration.for_each([&](scgms::SFilter_Configuration_Link chain_link) {
        if (current_index == target_index) {
            link = std::move(chain_link);
        }
        current_index++;
    });
}

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
        return "1";
    }
    const scgms::NParameter_Type parameter_type = StringToParameterType(parameter_type_string);
    if (parameter_type == scgms::NParameter_Type::ptNull) {
        std::cerr << "Invalid parameter type: " << parameter_type_string << std::endl;
        return "0";
    }
    std::wstring config_parameter_name_wstring = Widen_String(config_parameter_name);
    const wchar_t *config_parameter_name_wchar = config_parameter_name_wstring.c_str();

    scgms::SFilter_Parameter parameter = link.Resolve_Parameter(config_parameter_name_wchar);


    if (!parameter) {
        parameter = link.Add_Parameter(parameter_type, config_parameter_name_wchar);
        if (!parameter) {
            std::cerr << "Failed to add parameter: " << config_parameter_name << std::endl;
            return "1";
        }
    }

    HRESULT res = E_FAIL;
    GUID guid;

    switch (parameter_type) {
        case scgms::NParameter_Type::ptRatTime:
        case scgms::NParameter_Type::ptWChar_Array:
            std::cout << "Setting wstring: " << value << std::endl;
            res = parameter.set_wstring(Widen_String(value));
            break;
        case scgms::NParameter_Type::ptInt64_Array: // NERESIT
            // TODO NEVIM
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
                return "1";
            }
            res = parameter->Set_GUID(&guid);
            break;
        case scgms::NParameter_Type::ptDouble_Array:
            res = parameter.set_double_array(split_double_array(value));
            break;
        case scgms::NParameter_Type::ptSubject_Id: // NERESIT
            // TODO NEVIM
            break;
        case scgms::NParameter_Type::ptInvalid:
            // TODO NEVIM
            break;
        default:
            break;
    }
    if (!Succeeded(res)) {
        std::wcerr << L"Failed to set parameter value for: " << config_parameter_name_wchar << std::endl;
        return "1";
    }

    std::cout << "Successfully configured parameter: " << config_parameter_name << " with value: " << value <<
            std::endl;
    return "0";
}

std::string move_filter_up(int index) {
    HRESULT res = chain_configuration->move(index, index - 1);
    return Succeeded(res) ? "0" : "1";
}

std::string move_filter_down(int index) {
    HRESULT res = chain_configuration->move(index, index + 1);
    return Succeeded(res) ? "0" : "1";
}


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

std::vector<SignalInfo> get_available_signals() {
    const scgms::CSignal_Description signal_descriptors{};
    std::vector<SignalInfo> signals;
    signal_descriptors.for_each([&signals](const scgms::TSignal_Descriptor &desc) {
        signals.push_back(convert_signal_descriptor(desc));
    });
    return signals;
}

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

std::vector<ModelInfo> get_available_models() {
    std::vector model_desc = scgms::get_model_descriptor_list();
    std::vector<ModelInfo> models;
    for (const scgms::TModel_Descriptor &desc: model_desc) {
        ModelInfo model = convert_model_descriptor(desc);
        models.push_back(model);
    }
    return models;
}

std::vector<SolverInfo> get_available_solvers() {
    std::vector solver_desc = scgms::get_solver_descriptor_list();
    std::vector<SolverInfo> solvers;
    for (const scgms::TSolver_Descriptor &desc: solver_desc) {
        SolverInfo solver = convert_solver_descriptor(desc);
        solvers.push_back(solver);
    }
    return solvers;
}

std::vector<MetricInfo> get_available_metrics() {
    std::vector metric_desc = scgms::get_metric_descriptor_list();
    std::vector<MetricInfo> metrics;
    for (const scgms::TMetric_Descriptor &desc: metric_desc) {
        MetricInfo metric = convert_metric_descriptor(desc);
        metrics.push_back(metric);
    }
    return metrics;
}


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
        // std::wcout << p.configuration_name() << std::endl;
        if (link == nullptr) {
            param.default_value = get_parameter_default_value(type);
        } else {
            scgms::SFilter_Parameter p = link->Resolve_Parameter(filter.config_parameter_name[j]);
            param.default_value = p ? get_parameter_value(p) : get_parameter_default_value(type);
        }
        info.parameters.push_back(param);
    }
}

std::vector<FilterInfo> get_available_filters() {
    const std::vector<scgms::TFilter_Descriptor> filter_list = scgms::get_filter_descriptor_list();
    std::vector<FilterInfo> filters;
    // chain_configuration = scgms::SPersistent_Filter_Chain_Configuration();


    // Iterate through all filters
    for (size_t i = 0; i < filter_list.size(); ++i) {
        const scgms::TFilter_Descriptor &filter = filter_list[i];
        FilterInfo info;
        convert_filter_descriptor_to_info(filter, info);
        filters.push_back(info);
    }

    return filters;
}


std::vector<FilterInfo> get_chain_filters() {
    std::vector<FilterInfo> filters;
    chain_configuration.for_each([&filters](scgms::SFilter_Configuration_Link link) mutable {
        FilterInfo info;
        convert_filter_descriptor_to_info(link.descriptor(), info, &link);
        filters.push_back(info);
    });
    return filters;
}

int update_output_filters_parameters() {
    chain_configuration.for_each([](scgms::SFilter_Configuration_Link link) mutable {
        std::cout << "[CHAIN] Filter ID: " << Narrow_WChar(link.descriptor().description) << std::endl;
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
            std::cout << "Drawing filter width: " << drawing_v2_width << std::endl;
            std::cout << "Drawing filter height: " << drawing_v2_height << std::endl;
        }
    });
    return 0;
}


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


void retrieve_drawings() {
    svgs.clear();
    auto caps = refcnt::Create_Container_shared<scgms::TPlot_Descriptor>(nullptr, nullptr);

    if (insp_draw->Get_Capabilities(caps.get()) == S_OK && caps->empty() != S_OK) {
        scgms::TPlot_Descriptor *begin = nullptr;
        scgms::TPlot_Descriptor *end = nullptr;

        if (caps->get(&begin, &end) == S_OK) {
            int plot_index = 0;
            std::wcout << L"Available plots: " << std::distance(begin, end) << std::endl;

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
                    svg_info.id = Narrow_WString(GUID_To_WString(it->id));
                    svg_info.name = Narrow_WString(it->name);
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

std::vector<SvgInfo> get_svgs() {
    if (svgs.empty()) {
        std::cerr << "No SVGs available." << std::endl;
        return {};
    }
    std::cout << "SVGs available: " << svgs.size() << std::endl;
    return svgs;
}

std::vector<std::string> get_logs() {
    if (log_lines.empty()) {
        std::cerr << "No log lines available." << std::endl;
        return {};
    }
    return log_lines;
}
void log_svgs_to_console() {
    std::cout << "SVGs:" << std::endl;
    auto svgs = get_svgs();
    for (const auto &svg: svgs) {
        std::cout << "SVG ID: " << svg.id << std::endl;
        std::cout << "SVG Name: " << svg.name << std::endl;
        std::cout << "SVG String: " << svg.svg_str << std::endl;
    }
}

void retrieve_logs() {
    std::shared_ptr<refcnt::wstr_list> lines;
    while (insp_log.pop(lines)) {
        refcnt::wstr_container **begin, **end;
        if (lines) {
            if (lines->get(&begin, &end) == S_OK) {
                for (auto iter = begin; iter != end; iter++) {
                    log_lines.push_back(Narrow_WString(WChar_Container_To_WString(*iter)));
                    // std::cout << Narrow_WString(WChar_Container_To_WString(*iter)) << std::endl;
                }
            }
        }
    }
}

void monitor_drawing_updates_loop() {
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

std::string execute() {
    log_lines = {};
    svgs = {};
    refcnt::Swstr_list errors;
    if (Global_Filter_Executor) {
        return "0";
    }

    // Execute the filter chain
    Global_Filter_Executor = scgms::SFilter_Executor{
        chain_configuration.get(),
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

            monitor_thread = std::thread(monitor_drawing_updates_loop);
            std::cout << "[EXECUTE] Monitor thread started." << std::endl;
        }
        else {
            std::cout << "[EXECUTE] Insp not set! Drawing filter not detected." << std::endl;
        }


        std::cout << "[EXECUTE] Filter chain execution completed." << std::endl;
    } else {
        std::wcerr << L"[EXECUTE] Failed to create filter executor." << std::endl;
        errors.for_each([](const std::wstring &str) {
            std::wcerr << str << std::endl;
        });
        return "1";
    }
    return "0";
}



/**
 * API
 * @return  0 if the library is loaded successfully, 1 otherwise
 */
std::string load_scgms_lib() {
    if (!scgms::is_scgms_loaded()) {
        std::cerr << "SCGMS library is not loaded. Attempting to load..." << std::endl;

        std::wstring library_path = L"./scgms/libscgms.dylib";
        scgms::set_base_path(library_path);

        if (!scgms::is_scgms_loaded()) {
            std::cerr << "Library loading failed!" << std::endl;
            return "1";
        }
    }
    std::cout << "SCGMS library loaded successfully." << std::endl;
    return "0";
}

void init_config() {
    chain_configuration = scgms::SPersistent_Filter_Chain_Configuration();
}

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
        return "1";
    }

    std::cout << "Filter executor terminated successfully." << std::endl;
    Global_Filter_Executor = {};
    return "0";
}

/**
 * dummy API
 * @param number
 * @return number + 1
 */
int add_one(int number) {
    return number + 1;
}

void print_filter_info(std::vector<FilterInfo> filters) {
    for (const auto &filter: filters) {
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
}

PYBIND11_MAKE_OPAQUE(std::vector<FilterInfo>);

PYBIND11_MODULE(scgms_wrapper, m) {
    m.doc() = "SCGMS Python module"; // optional module docstring
    m.def("add_one", &add_one, "A function that adds 1 to a number (dummy func)");
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
}

bool are_filter_vectors_contents_equal(const std::vector<FilterInfo> &a, const std::vector<FilterInfo> &b) {
    if (a.size() != b.size()) {
        std::cout << "Filter vectors size mismatch: "
                << a.size() << " vs " << b.size() << std::endl;
        return false;
    }
    for (size_t i = 0; i < a.size(); ++i) {
        if (a[i].id != b[i].id || a[i].flags != b[i].flags || a[i].description != b[i].description ||
            a[i].parameters_count != b[i].parameters_count) {
            std::cout << "Filter " << i << " mismatch: "
                    << a[i].id << " vs " << b[i].id << std::endl;
            return false;
        }
        for (size_t j = 0; j < a[i].parameters_count; ++j) {
            if (a[i].parameters[j].parameter_type != b[i].parameters[j].parameter_type ||
                a[i].parameters[j].ui_parameter_name != b[i].parameters[j].ui_parameter_name ||
                a[i].parameters[j].config_parameter_name != b[i].parameters[j].config_parameter_name ||
                a[i].parameters[j].ui_parameter_tooltip != b[i].parameters[j].ui_parameter_tooltip ||
                a[i].parameters[j].default_value != b[i].parameters[j].default_value) {
                std::cout << "Filter " << i << " parameter " << j << " mismatch: "
                        << a[i].parameters[j].parameter_type << " vs "
                        << b[i].parameters[j].parameter_type << std::endl;
                return false;
            }
        }
    }
    return true;
}

bool are_svgs_equal(const std::vector<SvgInfo> &a, const std::vector<SvgInfo> &b) {
    if (a.size() != b.size()) {
        std::cout << "SVG vectors size mismatch: "
                << a.size() << " vs " << b.size() << std::endl;
        return false;
    }
    for (size_t i = 0; i < a.size(); ++i) {
        if (a[i].id != b[i].id || a[i].name != b[i].name || a[i].svg_str != b[i].svg_str) {
            std::cout << "SVG " << i << " mismatch: "
                    << a[i].id << " vs " << b[i].id << std::endl;
            std::cout << "SVG A str: " << a[i].svg_str << std::endl;
            std::cout << "SVG B str: " << b[i].svg_str << std::endl;
            return false;
        }
    }
    return true;
}

#ifdef COMPILE_AS_EXECUTABLE


int main() {
    HRESULT res = chain_configuration->Load_From_File(L"../conf_draw2.ini", nullptr);
    if (!Succeeded(res)) {
        std::cerr << "Failed to load configuration from file." << std::endl;
        return 1;
    }
    update_output_filters_parameters();
    execute();

    std::cout << "-----------BEFORE SLEEP------------" << std::endl;
    log_svgs_to_console();
    std::this_thread::sleep_for(std::chrono::seconds(8));
    // log svgs
    std::cout << "-----------AFTER SLEEP------------" << std::endl;
    log_svgs_to_console();

    stop_simulation();
    std::cout << "Simulation stopped." << std::endl;
    std::this_thread::sleep_for(std::chrono::seconds(3));


    return 0;
}
#endif
