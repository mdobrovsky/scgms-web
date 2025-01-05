cmake_minimum_required(VERSION 3.15)

# Název projektu
project(SCGMSWrapper LANGUAGES CXX)

# Nastavení standardu C++
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Přidání hlavičkových souborů (include paths)
include_directories(
        /usr/local/include/node
        /opt/homebrew/lib/python3.12/site-packages/pybind11/include
        /opt/homebrew/opt/python@3.12/Frameworks/Python.framework/Versions/3.12/include/python3.12
        ${CMAKE_SOURCE_DIR}/../scgms-release/common/scgms/rtl
)

# Přidání cest ke knihovnám (library paths)
link_directories(
        /usr/local/lib
        /opt/homebrew/opt/python@3.12/Frameworks/Python.framework/Versions/3.12/lib
        ${CMAKE_SOURCE_DIR}/../scgms-release/build/compiled
)

# Přidání zdrojového souboru pro Python modul
add_library(scgms_wrapper MODULE
        scgms_wrapper.cpp
)

# Nastavení přípony pro Python modul
set_target_properties(scgms_wrapper PROPERTIES
        SUFFIX ".cpython-312-darwin.so"
        LIBRARY_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/cmake-build-debug
)

# Linkování knihoven pro Python modul
target_link_libraries(scgms_wrapper
        scgms
        python3.12
)

# Přidání spustitelného programu pro ladění
add_executable(scgms_wrapper_debug
        scgms_wrapper.cpp  # Zdrojový soubor
)

# Linkování knihoven pro spustitelný program
target_link_libraries(scgms_wrapper_debug
        scgms
        python3.12
)
