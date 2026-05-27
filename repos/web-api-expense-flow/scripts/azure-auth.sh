#!/bin/bash
# Minimal Azure credential status indicator (works for auto + manual execution)

HOST_AZURE_CONFIG_DIR="${HOST_AZURE_CONFIG_DIR:-/tmp/host-azure}"

[ "${AZURE_AUTH_DEBUG:-0}" = "1" ] && set -x

echo "🔍 Checking Azure CLI credentials..."
echo "DIR: $HOST_AZURE_CONFIG_DIR"

status_not_configured() { echo "❌ Azure CLI: NOT CONFIGURED"; }
status_logged_out()     { echo "❌ Azure CLI: LOGGED OUT"; }
status_logged_in()      { echo "✅ Azure CLI: LOGGED IN"; }

# Determine state
if [ ! -d "$HOST_AZURE_CONFIG_DIR" ] || [ -z "$(ls -A "$HOST_AZURE_CONFIG_DIR" 2>/dev/null)" ]; then
  status_not_configured
else
  PROFILE="$HOST_AZURE_CONFIG_DIR/azureProfile.json"
  if [ -s "$PROFILE" ]; then
    # Consider logged-in if subscriptions array exists AND at least one id field
    if grep -q '"subscriptions"' "$PROFILE" 2>/dev/null && grep -q '"id"' "$PROFILE" 2>/dev/null; then
      status_logged_in
    else
      status_logged_out
    fi
  else
    status_logged_out
  fi
fi

echo "================================================"

export AZURE_CONFIG_DIR="$HOST_AZURE_CONFIG_DIR"

# If called without a following command, just exit cleanly
if [ $# -eq 0 ]; then
  exit 0
fi

exec "$@"
```