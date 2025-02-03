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

std::wstring listAvailableFilters() {
    std::vector<scgms::TFilter_Descriptor> filterList = scgms::get_filter_descriptor_list();
    std::wstringstream output;

    for (const auto &filter : filterList) {
        output << filter.description << " " << GUID_To_WString(filter.id) << std::endl;
        if (filter.parameters_count > 1) {
            output << "Parameter count: " <<  filter.parameters_count <<  std::endl;
            for (auto parameter_name: filter.ui_parameter_name) {
                output << parameter_name << std::endl;
            }
            // for (int i = 0; i < filter.parameters_count; i++) {
            //     output << filter.ui_parameter_name[i] << std::endl;
            //
            // }
        }
    }
    return output.str();
}



HRESULT on_filter_created_callback(const scgms::IFilter *filter, void *data) {
    if (filter) {
        std::wcout << L"Filter created successfully." << std::endl;

        scgms::SDrawing_Filter_Inspection_v2 insp(scgms::SFilter(filter));


    } else {
        std::wcerr << L"Error: Filter creation failed!" << std::endl;
    }

    return S_OK;
}

int execute(const std::wstring& config_path) {

    // Load Configuration
    scgms::SPersistent_Filter_Chain_Configuration configuration;
    refcnt::Swstr_list errors;


    if (Succeeded(configuration->Load_From_File(config_path.c_str(), errors.get()))) {
        std::cout << "Configuration loaded successfully." << std::endl;

        // Execute the filter chain
        Global_Filter_Executor = scgms::SFilter_Executor{
                configuration.get(),
                reinterpret_cast<scgms::TOn_Filter_Created>(on_filter_created_callback), // Callback function
                nullptr,                    // Callback data
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
std::string wstringToUtf8(const std::wstring& wstr) {
    std::string result;
    std::mbstate_t state = std::mbstate_t();
    const wchar_t* data = wstr.data();
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
m.doc() = "SCGMS dummy Python module";  // Dokumentace modulu
m.def("add_one", &add_one, "A function that adds 1 to a number");
m.def("load_scgms_lib", &load_scgms_lib, "Loads the SCGMS library");
m.def("list_available_filters", &listAvailableFiltersPython, "Lists available filters");
}

#ifdef COMPILE_AS_EXECUTABLE
int main() {

    std::cout << wstringToUtf8(listAvailableFilters());
    return 0;
}
#endif

