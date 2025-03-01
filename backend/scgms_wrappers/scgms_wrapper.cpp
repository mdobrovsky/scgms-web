#include <iostream>
#include <string>
#include <sstream>
#include <vector>


#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <pybind11/stl_bind.h>


#include "../../scgms-release/common/scgms/rtl/scgmsLib.h"
#include "../../scgms-release/common/scgms/rtl/AlignmentAllocator.h"
#include "../../scgms-release/common/scgms/rtl/ApproxLib.h"
#include "../../scgms-release/common/scgms/rtl/Common_Calculated_Signal.h"
#include "../../scgms-release/common/scgms/rtl/DbLib.h"
#include "../../scgms-release/common/scgms/rtl/DeviceLib.h"
#include "../../scgms-release/common/scgms/rtl/Dynamic_Library.h"
#include "../../scgms-release/common/scgms/rtl/FilesystemLib.h"
#include "../../scgms-release/common/scgms/rtl/FilterLib.h"
#include "../../scgms-release/common/scgms/rtl/guid.h"
#include "../../scgms-release/common/scgms/rtl/hresult.h"
#include "../../scgms-release/common/scgms/rtl/manufactory.h"
#include "../../scgms-release/common/scgms/rtl/ModelsLib.h"
#include "../../scgms-release/common/scgms/rtl/rattime.h"
#include "../../scgms-release/common/scgms/rtl/referencedImpl.h"
#include "../../scgms-release/common/scgms/rtl/SolverLib.h"
#include "../../scgms-release/common/scgms/rtl/UILib.h"
#include "../../scgms-release/common/scgms/utils/string_utils.h"


solver::TSolver_Progress Global_Progress = solver::Null_Solver_Progress; // so that we can cancel from sigint
scgms::SFilter_Executor Global_Filter_Executor;

scgms::SPersistent_Filter_Chain_Configuration chain_configuration;

// structures for filter info
struct FilterParameter {
    std::string parameter_type;
    std::string ui_parameter_name;
    std::string config_parameter_name;
    std::string ui_parameter_tooltip;
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

MetricInfo convert_metric_descriptor(const scgms::TMetric_Descriptor &desc) {
    MetricInfo metric;
    metric.id = Narrow_WString(GUID_To_WString(desc.id));
    metric.description = Narrow_WString(desc.description);
    return metric;
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
    chain_configuration.Add_Link(WString_To_GUID(Widen_String(guid_string), ok));
    return ok ? "0" : "1";
}

std::string save_configuration(std::string &path) {
    refcnt::Swstr_list errors;

    HRESULT res = chain_configuration->Save_To_File(Widen_String(path).c_str(), errors.get());

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

std::string create_parameters(const scgms::TFilter_Descriptor &filter) {
    scgms::SFilter_Configuration_Link link = chain_configuration.Add_Link(filter.id);

    for (int j = 0; j < filter.parameters_count; ++j) {
        scgms::SFilter_Parameter parameter = link.Resolve_Parameter(filter.config_parameter_name[j]);
        if (filter.parameter_type[j] == scgms::NParameter_Type::ptNull) {
            continue;
        }
        if (!parameter) {
            std::wcerr << L"Failed to resolve parameter. Creating" << std::endl;
            parameter = link.Add_Parameter(filter.parameter_type[j], filter.config_parameter_name[j]);
            if (!parameter) {
                continue;
            }
        }
        HRESULT res;

        switch (filter.parameter_type[j]) {
            case scgms::NParameter_Type::ptWChar_Array:
                std::cout << "SETTING WCHAR ARRAY" << std::endl;
                parameter.set_wstring(L"test");
                break;
            case scgms::NParameter_Type::ptInt64_Array:
                std::cout << "SETTING INT64 ARRAY" << std::endl;
            // parameter->arra TODO NEVIM
                break;
            case scgms::NParameter_Type::ptDouble:
                std::cout << "SETTING DOUBLE" << std::endl;
            // parameter->Set_Double(3.14);
                break;
            case scgms::NParameter_Type::ptRatTime:
                std::cout << "SETTING RATTIME" << std::endl;
            // parameter-> TODO NEVIM
                break;
            case scgms::NParameter_Type::ptInt64:
                std::cout << "SETTING INT64" << std::endl;
            // parameter->Set_Int64(123);
                break;
            case scgms::NParameter_Type::ptBool:
                std::cout << "SETTING BOOL" << std::endl;
            // parameter->Set_Bool(true);
                break;
            case scgms::NParameter_Type::ptSignal_Model_Id:
                std::cout << "SETTING SIGNAL MODEL ID" << std::endl;
            // parameter-> TODO NEVIM
                break;
            case scgms::NParameter_Type::ptDiscrete_Model_Id:
                std::cout << "SETTING DISCRETE MODEL ID" << std::endl;
            // return L"ptDiscrete_Model_Id"; TODO NEVIM
                break;
            case scgms::NParameter_Type::ptMetric_Id:
                std::cout << "SETTING METRIC ID" << std::endl;
            // return L"ptMetric_Id"; TODO NEVIM
                break;
            case scgms::NParameter_Type::ptSolver_Id:
                std::cout << "SETTING SOLVER ID" << std::endl;
            // return L"ptSolver_Id"; TODO NEVIM
                break;
            case scgms::NParameter_Type::ptModel_Produced_Signal_Id:
                std::cout << "SETTING MODEL PRODUCED SIGNAL ID" << std::endl;
            // return L"ptModel_Produced_Signal_Id"; TODO NEVIM
                break;
            case scgms::NParameter_Type::ptSignal_Id:
                std::cout << "SETTING SIGNAL ID" << std::endl;
                res = parameter->Set_GUID(&Invalid_GUID);
                break;
            case scgms::NParameter_Type::ptDouble_Array:
                std::cout << "SETTING DOUBLE ARRAY" << std::endl;
            // return L"ptDouble_Array"; TODO NEVIM
                break;
            case scgms::NParameter_Type::ptSubject_Id:
                std::cout << "SETTING SUBJECT ID" << std::endl;
            // parameter-> TODO NEVIM
                break;
            case scgms::NParameter_Type::ptInvalid:
                std::cout << "SETTING INVALID" << std::endl;
            // TODO NEVIM
                break;
            default:
                break;
        }
        if (!Succeeded(res)) {
            std::wcerr << L"Failed to set parameter value." << std::endl;
            return "1";
        }
    }
    return "0";
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
        }
        else {
            model.parameter_db_column_names.push_back( "");
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
    std::vector<scgms::TMetric_Descriptor> metric_desc = scgms::get_metric_descriptor_list();
    std::vector<MetricInfo> metrics;
    for (const scgms::TMetric_Descriptor &desc: metric_desc) {
        MetricInfo metric = convert_metric_descriptor(desc);
        metrics.push_back(metric);
    }
    return metrics;
}





std::vector<FilterInfo> get_available_filters() {
    const std::vector<scgms::TFilter_Descriptor> filter_list = scgms::get_filter_descriptor_list();
    std::vector<FilterInfo> filters;
    chain_configuration = scgms::SPersistent_Filter_Chain_Configuration();


    // Iterate through all filters
    for (size_t i = 0; i < filter_list.size(); ++i) {
        const scgms::TFilter_Descriptor &filter = filter_list[i];
        // if (i == 9) {
        //     create_parameters(filter);
        // }
        FilterInfo info;
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
            info.parameters.push_back(param);
        }
        filters.push_back(info);
    }
    std::string path = std::string("./my_config.ini");
    std::cout << "SAVED: " << save_configuration(path) << std::endl;

    return filters;
}


HRESULT on_filter_created_callback(const scgms::IFilter *filter, void *data) {
    if (filter) {
        std::wcout << L"Filter created successfully." << std::endl;

        scgms::SDrawing_Filter_Inspection_v2 insp(scgms::SFilter (filter));
    } else {
        std::wcerr << L"Error: Filter creation failed!" << std::endl;
    }

    return S_OK;
}

int execute(const std::wstring &config_path) {
    // Load Configuration
    scgms::SPersistent_Filter_Chain_Configuration configuration = scgms::SPersistent_Filter_Chain_Configuration();
    refcnt::Swstr_list errors;


    if (Succeeded(configuration->Load_From_File(config_path.c_str(), errors.get()))) {
        std::cout << "Configuration loaded successfully." << std::endl;

        // Execute the filter chain
        Global_Filter_Executor = scgms::SFilter_Executor{
            configuration.get(),
            reinterpret_cast<scgms::TOn_Filter_Created>(on_filter_created_callback), // Callback function
            nullptr, // Callback data
            errors,
        };

        if (Global_Filter_Executor) {
            std::cout << "Filter chain execution started successfully." << std::endl;

            // Wait for execution to complete
            Global_Filter_Executor->Terminate(TRUE);
            std::cout << "Filter chain execution completed." << std::endl;
        } else {
            std::wcerr << L"Failed to create filter executor." << std::endl;
            errors.for_each([](const std::wstring &str) {
                std::wcerr << str << std::endl;
            });
        }
    } else {
        std::wcerr << L"Failed to load configuration from file: " << config_path << std::endl;
        errors.for_each([](const std::wstring &str) {
            std::wcerr << str << std::endl;
        });
    }

    return 0;
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

/**
 * dummy API
 * @param number
 * @return number + 1
 */
int add_one(int number) {
    return number + 1;
}

PYBIND11_MAKE_OPAQUE(std::vector<FilterInfo>);

PYBIND11_MODULE(scgms_wrapper, m) {
    m.doc() = "SCGMS Python module"; // optional module docstring
    m.def("add_one", &add_one, "A function that adds 1 to a number (dummy func)");
    m.def("load_scgms_lib", &load_scgms_lib, "Loads the SCGMS library");
    m.def("add_filter", &add_filter, "Adds a filter to the configuration");
    m.def("save_configuration", &save_configuration, "Saves the configuration to a file");
    m.def("remove_filter", &remove_filter, "Removes a filter from the configuration");
    // Expose structures for working with filters
    namespace py = pybind11;
    py::class_<FilterParameter>(m, "FilterParameter")
            .def_readonly("parameter_type", &FilterParameter::parameter_type)
            .def_readonly("ui_parameter_name", &FilterParameter::ui_parameter_name)
            .def_readonly("config_parameter_name", &FilterParameter::config_parameter_name)
            .def_readonly("ui_parameter_tooltip", &FilterParameter::ui_parameter_tooltip);

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
            .def_readonly("number_of_segment_specific_parameters", &ModelInfo::number_of_segment_specific_parameters)
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
}

#ifdef COMPILE_AS_EXECUTABLE
int main() {

    // std::vector<MetricInfo> metrics = get_available_metrics();
    // for (const MetricInfo &metric: metrics) {
    //     std::cout << "Metric ID: " << metric.id << std::endl;
    //     std::cout << "Description: " << metric.description << std::endl;
    //     std::cout << std::endl;
    // }


    return 0;
}
#endif
