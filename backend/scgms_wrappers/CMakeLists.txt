cmake_minimum_required(VERSION 3.15)

project(SCGMSWrapper LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(
        /usr/local/include/node
        /opt/homebrew/lib/python3.12/site-packages/pybind11/include
        /opt/homebrew/opt/python@3.12/Frameworks/Python.framework/Versions/3.12/include/python3.12
        ${CMAKE_SOURCE_DIR}/../scgms-release/common/scgms/rtl
)

link_directories(
        /usr/local/lib
        /opt/homebrew/opt/python@3.12/Frameworks/Python.framework/Versions/3.12/lib
        ${CMAKE_SOURCE_DIR}/../scgms-release/build/compiled
)

# 🔧 /Users/martindobrovsky/Desktop/bakalarska_prace/SCGMS_WEB/backend/scgms-release/build/compiled/libscgms-common.a
set(SCGMS_COMMON_LIB ${CMAKE_SOURCE_DIR}/../scgms-release/build/compiled/libscgms-common.a)
set(SCGMS_LIB ${CMAKE_SOURCE_DIR}/../scgms-release/build/compiled/libscgms.dylib)

add_library(scgms_wrapper MODULE
        scgms_wrapper.cpp
)

set_target_properties(scgms_wrapper PROPERTIES
        PREFIX ""
        SUFFIX ".cpython-312-darwin.so"
        LIBRARY_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/../flask_middleware/
)


add_executable(scgms_wrapper_debug
        scgms_wrapper.cpp
)

target_compile_definitions(scgms_wrapper_debug PRIVATE COMPILE_AS_EXECUTABLE)

target_link_libraries(scgms_wrapper
        ${SCGMS_COMMON_LIB}
        ${SCGMS_LIB}
        python3.12
)

target_link_libraries(scgms_wrapper_debug
        ${SCGMS_COMMON_LIB}
        ${SCGMS_LIB}
        python3.12
)
