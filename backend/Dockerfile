FROM python:3.12 AS builder

# Build type
ENV BUILD_TYPE=Release

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    libeigen3-dev \
    libboost-all-dev \
    pybind11-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
RUN git clone https://github.com/SmartCGMS/scgms-release.git

# COPY ./scgms-release ./scgms-release
COPY ./scgms_wrappers ./scgms_wrappers
COPY ./flask_middleware ./flask_middleware

WORKDIR /build/scgms-release

RUN git submodule update --remote --init || true

# Build ExcelFormat
WORKDIR /build/scgms-release/deps/ExcelFormat
RUN rm -rf CMakeCache.txt CMakeFiles/ && \
    cmake . -DCMAKE_BUILD_TYPE=${BUILD_TYPE} -DCMAKE_C_FLAGS="-fPIC" -DCMAKE_CXX_FLAGS="-fPIC" && \
    cmake --build . --config ${BUILD_TYPE}

# Build xlnt
WORKDIR /build/scgms-release/deps/xlnt
RUN rm -rf CMakeCache.txt CMakeFiles/ && \
    cmake . -DCMAKE_BUILD_TYPE=${BUILD_TYPE} -DCMAKE_C_FLAGS="-fPIC" -DCMAKE_CXX_FLAGS="-fPIC" && \
    cmake --build . --config ${BUILD_TYPE}

# Build SCGMS
WORKDIR /build/scgms-release
RUN rm -rf build && \ 
   cmake -B build \
    -DCMAKE_BUILD_TYPE=${BUILD_TYPE} \
    -DCMAKE_POSITION_INDEPENDENT_CODE=ON \
    -DXLNT_INCLUDE=deps/xlnt/include/ \
    -DXLNT_LIBRARY=deps/xlnt/source/ \
    -DEXCELFORMAT_INCLUDE=deps/ExcelFormat/include/ \
    -DEXCELFORMAT_LIBRARY=deps/ExcelFormat/ \
    -DEIGEN3_INCLUDE=deps/Eigen3 \
    -DBUILD_CORE_ONLY=TRUE \
    -DQt_DISABLE=1

RUN cmake --build build --config ${BUILD_TYPE}

WORKDIR /build/scgms_wrappers

RUN mv CMakeLists.txt CMakeLists.dev && mv CMakeLists.prod CMakeLists.txt
RUN rm -rf build && \
    cmake -B build -DCMAKE_BUILD_TYPE=${BUILD_TYPE} && \
    cmake --build build --config ${BUILD_TYPE}

# RUN cp -r /build/scgms-release/build/compiled/* /build/scgms_wrappers/build/

RUN cp -r /build/scgms-release/build/compiled/* /build/scgms_wrappers/build/
RUN cp -r /build/scgms_wrappers/build/* /build/flask_middleware/

RUN pip install --no-cache-dir flask flask_cors

WORKDIR /build/flask_middleware
EXPOSE 5000
CMD ["python", "app.py"]

