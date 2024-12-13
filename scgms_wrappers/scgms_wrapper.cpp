#include <iostream>
#include <string>
#include <sstream>
#include <vector>

//#include "../backend/node_modules/node-addon-api/napi.h"

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


/*
 * Run configuration
 * -std=c++17
 * -Wl,-rpath,./scgms/
 * -L./scgms/
 * -lscgms
 * */

solver::TSolver_Progress Global_Progress = solver::Null_Solver_Progress; //so that we can cancel from sigint
scgms::SFilter_Executor Global_Filter_Executor;

std::wstring listAvailableFilters() {
    std::vector<scgms::TFilter_Descriptor> filterList = scgms::get_filter_descriptor_list();
    std::wstringstream output;

    for (const auto &filter : filterList) {
        output << filter.description << std::endl;
    }
    return output.str();
}

int load_scgms_lib() {
    if (!scgms::is_scgms_loaded()) {
        std::cerr << "SCGMS library is not loaded. Attempting to load..." << std::endl;

        std::wstring library_path = L"./scgms/libscgms.dylib";
        scgms::set_base_path(library_path);

        if (!scgms::is_scgms_loaded()) {
            std::cerr << "Library loading failed!" << std::endl;
            return 1;
        }
    }

    std::cout << "SCGMS library loaded successfully." << std::endl;
    return 0;
}

//void on_filter_created_callback(void* data) {
//    // Callback for when a filter is created
//    std::cout << "Filter created." << std::endl;
//}

void on_filter_created_callback(const scgms::IFilter *filter, void *data) {
    if (filter) {
        std::wcout << L"Filter created successfully." << std::endl;
    } else {
        std::wcerr << L"Error: Filter creation failed!" << std::endl;
    }
}

int execute() {
    const std::wstring config_path = L"./testovaci_konfig.ini";

    // Load Configuration
    scgms::SPersistent_Filter_Chain_Configuration configuration;
    refcnt::Swstr_list errors;

    if (Succeeded(configuration->Load_From_File(config_path.c_str(), errors.get()))) {
        std::cout << "Configuration loaded successfully." << std::endl;
        // debug what is in the configuration

        // Set variables (if required)
        // Example: configuration->Set_Variable(L"parameter_name", L"value");

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

//// Pomocná funkce pro převod std::wstring na std::string (UTF-8)
//std::string wstringToUtf8(const std::wstring& wstr) {
//    std::string result;
//    std::mbstate_t state = std::mbstate_t();
//    const wchar_t* data = wstr.data();
//    size_t len = 1 + std::wcsrtombs(nullptr, &data, 0, &state);
//
//    std::vector<char> buffer(len);
//    std::wcsrtombs(buffer.data(), &data, buffer.size(), &state);
//    result.assign(buffer.data(), buffer.size() - 1);
//    return result;
//}

// Wrapper pro Node.js
//Napi::String ListAvailableFiltersWrapper(const Napi::CallbackInfo& info) {
//    Napi::Env env = info.Env();
//
//    // Získání seznamu filtrů jako std::wstring
//    std::wstring wideFilters = listAvailableFilters();
//
//    // Převod na std::string (UTF-8)
//    std::string filters = wstringToUtf8(wideFilters);
//
//    // Vrácení výsledku do Node.js
//    return Napi::String::New(env, filters);
//}


//Napi::Object Init(Napi::Env env, Napi::Object exports) {
//    exports.Set(Napi::String::New(env, "listAvailableFilters"), Napi::Function::New(env, ListAvailableFiltersWrapper));
//    return exports;
//}


int main() {

    if (scgms::is_scgms_loaded()) {
        std::cout << "SCGMS library successfully loaded." << std::endl;
        std::wstring filters = listAvailableFilters();
        std::wcout << filters << std::endl;
    } else {
        std::cerr << "SCGMS library is not loaded." << std::endl;
    }

//    execute();


    return 0;
}
