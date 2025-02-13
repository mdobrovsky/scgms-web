#include <iostream>
#include <string>
#include <sstream>
#include <vector>


#include <pybind11/pybind11.h>


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


std::wstring listAvailableFilters() {
    const std::vector<scgms::TFilter_Descriptor> filter_list = scgms::get_filter_descriptor_list();
    std::wstringstream output;
    chain_configuration = scgms::SPersistent_Filter_Chain_Configuration();

    output << L"{\"filters\":[";

    // Iterate through all filters
    for (size_t i = 0; i < filter_list.size(); ++i) {
        const scgms::TFilter_Descriptor &filter = filter_list[i];
        // if (i == 5) {
        //     // std::string success = add_filter(Narrow_WString(GUID_To_WString(filter.id)));
        //     // std::cout << success << std::endl;
        //     // test one configuration parameter
        //     scgms::SFilter_Configuration_Link link = chain_configuration.Add_Link(filter.id);
        //
        //     for (int j = 0; j < filter.parameters_count; ++j) {
        //         scgms::SFilter_Parameter parameter = link.Resolve_Parameter(filter.config_parameter_name[j]);
        //         if (!parameter && (filter.parameter_type[j] != scgms::NParameter_Type::ptNull)) {
        //             std::wcerr << L"Failed to resolve parameter. Creating" << std::endl;
        //             parameter = link.Add_Parameter(scgms::NParameter_Type::ptBool, filter.config_parameter_name[j]);
        //             if (!parameter) {
        //                 continue;
        //             }
        //         }
        //         HRESULT res = parameter->Set_Bool(true);
        //         if (!Succeeded(res)) {
        //             std::wcerr << L"Failed to set parameter value." << std::endl;
        //         }
        //     }
        //
        //     print_configuration();
        // }
        if (i > 0) {
            output << L",";
        }

        output << L"{";
        // Convert GUID to string
        output << L"\"id\":\"" << GUID_To_WString(filter.id) << L"\",";
        // Output flags (converted to int)
        output << L"\"flags\":" << static_cast<int>(filter.flags) << L",";
        // Output filter description
        output << L"\"description\":\"" << filter.description << L"\",";
        // Output number of parameters
        output << L"\"parameters_count\":" << filter.parameters_count << L",";

        // Insert parameters array
        output << L"\"parameters\":[";
        for (size_t j = 0; j < filter.parameters_count; ++j) {
            if (j > 0) {
                output << L",";
            }
            output << L"{";
            // Output parameter type (as number)
            scgms::NParameter_Type type = filter.parameter_type[j];
            output << L"\"parameter_type\":\"" << ParameterTypeToString(type) << L"\",";
            // Output UI parameter name
            output << L"\"ui_parameter_name\":\""
                    << (filter.ui_parameter_name[j] ? filter.ui_parameter_name[j] : L"") << L"\",";
            // Output config parameter name
            output << L"\"config_parameter_name\":\""
                    << (filter.config_parameter_name[j] ? filter.config_parameter_name[j] : L"") << L"\",";
            // Output tooltip
            output << L"\"ui_parameter_tooltip\":\""
                    << (filter.ui_parameter_tooltip[j] ? filter.ui_parameter_tooltip[j] : L"") << L"\"";
            output << L"}";
        }
        output << L"]"; // end of parameters array

        output << L"}"; // end of one filter
    }

    output << L"]}"; // end of filters array
    return output.str();
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

// help function for conversion std::wstring on std::string (UTF-8)
std::string wstringToUtf8(const std::wstring &wstr) {
    std::string result;
    std::mbstate_t state = std::mbstate_t();
    const wchar_t *data = wstr.data();
    size_t len = 1 + std::wcsrtombs(nullptr, &data, 0, &state);

    std::vector<char> buffer(len);
    std::wcsrtombs(buffer.data(), &data, buffer.size(), &state);
    result.assign(buffer.data(), buffer.size() - 1);
    return result;
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
 * API
 * @return list of available filters
 */
std::string listAvailableFiltersPython() {
    std::wstring filters = listAvailableFilters();
    return wstringToUtf8(filters);
}

/**
 * dummy API
 * @param number
 * @return number + 1
 */
int add_one(int number) {
    return number + 1;
}

PYBIND11_MODULE(scgms_wrapper, m) {
    m.doc() = "SCGMS Python module"; // Dokumentace modulu
    m.def("add_one", &add_one, "A function that adds 1 to a number");
    m.def("load_scgms_lib", &load_scgms_lib, "Loads the SCGMS library");
    m.def("list_available_filters", &listAvailableFiltersPython, "Lists available filters");
    m.def("add_filter", &add_filter, "Adds a filter to the configuration");
    m.def("save_configuration", &save_configuration, "Saves the configuration to a file");

}

#ifdef COMPILE_AS_EXECUTABLE
int main() {
    // std::cout << wstringToUtf8(listAvailableFilters());
    listAvailableFilters();

    return 0;
}
#endif
