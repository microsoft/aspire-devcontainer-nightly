#!/bin/bash
# Runs during Codespaces prebuild (onCreateCommand).
# Installs the Aspire CLI with retry logic, then clears the NuGet cache
# so it does not inflate the prebuild template size.
set -euo pipefail

MAX_ATTEMPTS=5
RETRY_DELAY=15
INSTALL_SCRIPT="$(mktemp /tmp/aspire-install-XXXXXX.sh)"
trap 'rm -f "$INSTALL_SCRIPT"' EXIT

echo "Installing Aspire CLI (nightly)..."
for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
    if curl -fsSL --retry 3 --retry-delay 5 --retry-connrefused \
            https://aspire.dev/install.sh \
            -o "$INSTALL_SCRIPT" \
       && bash "$INSTALL_SCRIPT" -q dev; then
        echo "Aspire CLI installed successfully."
        break
    fi

    if [ "$attempt" -eq "$MAX_ATTEMPTS" ]; then
        echo "ERROR: Failed to install Aspire CLI after $MAX_ATTEMPTS attempts." >&2
        exit 1
    fi

    echo "Attempt $attempt/$MAX_ATTEMPTS failed. Retrying in ${RETRY_DELAY}s..."
    sleep "$RETRY_DELAY"
done

echo "Clearing NuGet cache to reduce prebuild template size..."
dotnet nuget locals all --clear

echo "onCreateCommand completed successfully."
