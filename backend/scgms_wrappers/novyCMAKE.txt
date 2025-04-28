cmake_minimum_required(VERSION 3.15)
project(SCGMSWrapper LANGUAGES CXX)

set(CMAKE_BUILD_TYPE Debug)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Python3 3.12 REQUIRED COMPONENTS Interpreter Development)
find_package(pybind11 REQUIRED)

if(APPLE)
    set(SCGMS_LIB_NAME libscgms.dylib)
else()
    set(SCGMS_LIB_NAME libscgms.so)
endif()

set(SCGMS_COMMON_LIB "${CMAKE_SOURCE_DIR}/../scgms-release/build/compiled/libscgms-common.a")
set(SCGMS_LIB "${CMAKE_SOURCE_DIR}/../scgms-release/build/compiled/${SCGMS_LIB_NAME}")

include_directories(
        ${Python3_INCLUDE_DIRS}
        ${pybind11_INCLUDE_DIRS}
        ${CMAKE_SOURCE_DIR}/../scgms-release/common/scgms/rtl
)

link_directories(${CMAKE_SOURCE_DIR}/../scgms-release/build/compiled)

pybind11_add_module(scgms_wrapper MODULE scgms_wrapper.cpp)

target_link_libraries(scgms_wrapper PRIVATE
        ${SCGMS_COMMON_LIB}
        ${SCGMS_LIB}
        Python3::Python
)

set_target_properties(scgms_wrapper PROPERTIES
        PREFIX ""
        LIBRARY_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/../flask_middleware
)

add_executable(scgms_wrapper_debug scgms_wrapper.cpp)
target_compile_definitions(scgms_wrapper_debug PRIVATE COMPILE_AS_EXECUTABLE)

target_link_libraries(scgms_wrapper_debug PRIVATE
        ${SCGMS_COMMON_LIB}
        ${SCGMS_LIB}
        Python3::Python
)
