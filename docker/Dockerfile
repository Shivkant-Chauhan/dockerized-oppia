# node:16.13.0
FROM --platform=linux/amd64 node@sha256:fc9d89b3ca185a65d0e3bef332a173799088338dfd79c77b2440c7cb387ad2e9 AS frontend

WORKDIR /app/oppia

RUN apt-get update -y && apt-get upgrade -y \
    curl \
    git \
    npm

# Installing packages from the package.json file
COPY package.json .
COPY scripts/linters/custom_eslint_checks ./scripts/linters/custom_eslint_checks

RUN npm install -g yarn@1.22.15 --force
# mathjs ESOCKETTIMEDOUT error fix -- https://stackoverflow.com/questions/55845756/esockettimedout-error-while-yarn-install-command
RUN yarn install --network-timeout 1000000


# Using digestID of the 3rd party dockerhub image, as updates in the dockerhub images might break the build
# Added platform flag here because -- https://stackoverflow.com/questions/71040681/qemu-x86-64-could-not-open-lib64-ld-linux-x86-64-so-2-no-such-file-or-direc
# python:3.8.17
FROM --platform=linux/amd64 python@sha256:90834dba6381dfc3957573dc7a3e6c5c8ed255cf60079329a6da2b5e6d4257b8 AS backend

WORKDIR /

ENV oppia_is_dockerized="true"

# Installing the pre-requisites libs and dependencies
RUN apt-get update -y && apt-get upgrade -y \
    npm \
    openjdk-11-jre \
    python2 \
    python3-matplotlib \
    python3-setuptools \
    python3-yaml \
    unzip \
    wget

RUN pip install --upgrade pip==21.2.3
RUN pip install pip-tools==6.6.2 setuptools==58.5.3 cmake

# Installing google cloud sdk
RUN wget -O gcloud-sdk.tar.gz https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-364.0.0-linux-x86_64.tar.gz && \
    tar -xzf gcloud-sdk.tar.gz && \
    ./google-cloud-sdk/install.sh --quiet && \
    rm gcloud-sdk.tar.gz

WORKDIR /app/oppia

# Installing python dependencies from the requirements_dev.txt file
COPY requirements_dev.txt .

RUN pip install -r requirements_dev.txt

# Installing buf and proto for Linux -- this docker container is based on Linux
COPY buf.gen.yaml .
COPY /extensions/classifiers/proto/ ./extensions/classifiers/proto/

# Installing third party dependencies
COPY scripts ./scripts
COPY /core ./core
COPY /assets ./assets
COPY dependencies.json .

# Installation for proto buf requires the third party dependencies to be installed (oppia-ml-proto)
# This also downloads frontend dependencies, which should be removed once the dependencies.json is deprecated
RUN python -m scripts.install_dependencies_json_packages

ENV BUF_LINUX_FILES="buf-Linux-x86_64 protoc-gen-buf-check-lint-Linux-x86_64 protoc-gen-buf-check-breaking-Linux-x86_64" \
    PROTOC_LINUX_FILE='protoc-3.13.0-linux-x86_64.zip' \
    BUF_DIR='/app/buf-0.29.0' \
    PROTOC_DIR='/app/buf-0.29.0/protoc' \
    BUF_BASE_URL='https://github.com/bufbuild/buf/releases/download/v0.29.0/' \
    PROTOC_URL='https://github.com/protocolbuffers/protobuf/releases/download/v3.13.0'

# Download BUF_LINUX_FILES and PROTOC_LINUX_FILE
# Set the shell as /bin/bash explicitly. This is required to make use of the array syntax correctly
SHELL ["/bin/bash", "-c"]
RUN IFS=' ' read -ra BUF_FILES <<< "$BUF_LINUX_FILES"; \
    for bin_file in "${BUF_FILES[@]}"; do \
        wget -P $BUF_DIR $BUF_BASE_URL/$bin_file; \
    done

RUN wget -P $BUF_DIR $PROTOC_URL/$PROTOC_LINUX_FILE
RUN unzip $BUF_DIR/$PROTOC_LINUX_FILE -d $PROTOC_DIR \
    && rm $BUF_DIR/$PROTOC_LINUX_FILE

RUN chmod -R 744 $BUF_DIR \
    && chmod -R 744 $PROTOC_DIR

# Compiling the protobuf files
ENV PROTOC_FILES_PATH='/app/oppia/third_party/oppia-ml-proto-0.0.0'

RUN npm install protoc-gen-ts@0.3.4 google-protobuf@3.13.0 typescript@4.1.6
RUN mkdir /app/oppia/proto_files
RUN /app/buf-0.29.0/protoc/bin/protoc \
    --plugin=protoc-gen-ts=/app/oppia/node_modules/.bin/protoc-gen-ts \
    --ts_out=/app/oppia/extensions/classifiers/proto/ \
    --js_out=import_style=commonjs,binary:/app/oppia/extensions/classifiers/proto/ \
    --python_out=/app/oppia/proto_files \
    --proto_path=$PROTOC_FILES_PATH \
    $PROTOC_FILES_PATH/*.proto

RUN sed -i 's/import text_classifier_pb2 as text__classifier__pb2/from . import text_classifier_pb2 as text__classifier__pb2/' /app/oppia/proto_files/training_job_response_payload_pb2.py

RUN python -m scripts.build

COPY --from=frontend /app/oppia/node_modules ./node_modules
COPY . .

EXPOSE 8089
EXPOSE 8000
EXPOSE 8181
