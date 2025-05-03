FROM scgms-prebuilt-release AS scgms-core
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
COPY --from=scgms-core /build/scgms-release ./scgms-release
COPY ./scgms_wrappers ./scgms_wrappers
COPY ./flask_middleware ./flask_middleware
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

