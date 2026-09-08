FROM mcr.microsoft.com/devcontainers/base:3-ubuntu24.04

# The nightly CLI needs ICU even when the standalone .NET SDK feature is omitted.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libicu74 \
    && rm -rf /var/lib/apt/lists/*
