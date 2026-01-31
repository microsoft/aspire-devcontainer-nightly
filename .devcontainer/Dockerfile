FROM mcr.microsoft.com/devcontainers/dotnet:dev-10.0-noble

# Fix Yarn GPG key issue - remove the problematic Yarn repository
# that has an expired/rotated signing key causing apt-get update to fail
# See: https://github.com/devcontainers/images/issues/1752
RUN rm -f /etc/apt/sources.list.d/yarn.list 2>/dev/null || true
