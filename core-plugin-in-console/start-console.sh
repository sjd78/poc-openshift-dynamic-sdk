#!/usr/bin/env -S bash -e
#
# See: https://github.com/spadgett/console-plugin-template/blob/main/start-console.sh
# See: https://github.com/konveyor/forklift-console-plugin/blob/main/scripts/start-console.sh
#
set -euo pipefail

CONSOLE_IMAGE=${CONSOLE_IMAGE:="quay.io/openshift/origin-console:latest"}
CONSOLE_PORT=${CONSOLE_PORT:=9000}

echo "Starting local OpenShift console..."

export BRIDGE_USER_AUTH="disabled"
export BRIDGE_K8S_MODE="off-cluster"
export BRIDGE_K8S_AUTH="bearer-token"
export BRIDGE_K8S_MODE_OFF_CLUSTER_SKIP_VERIFY_TLS=true
export BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT=$(oc whoami --show-server)
export BRIDGE_K8S_AUTH_BEARER_TOKEN=$(oc whoami --show-token 2>/dev/null)
export BRIDGE_USER_SETTINGS_LOCATION="localstorage"

export BRIDGE_BRANDING=openshift
export BRIDGE_V=10

# The monitoring operator is not always installed (e.g. for local OpenShift). Tolerate missing config maps.
# set +e
# BRIDGE_K8S_MODE_OFF_CLUSTER_THANOS=$(oc -n openshift-config-managed get configmap monitoring-shared-config -o jsonpath='{.data.thanosPublicURL}' 2>/dev/null)
# BRIDGE_K8S_MODE_OFF_CLUSTER_ALERTMANAGER=$(oc -n openshift-config-managed get configmap monitoring-shared-config -o jsonpath='{.data.alertmanagerPublicURL}' 2>/dev/null)
# set -e

# # Don't fail if the cluster doesn't have gitops.
# set +e
# GITOPS_HOSTNAME=$(oc -n openshift-gitops get route cluster -o jsonpath='{.spec.host}' 2>/dev/null)
# set -e
# if [ -n "$GITOPS_HOSTNAME" ]; then
#     BRIDGE_K8S_MODE_OFF_CLUSTER_GITOPS="https://$GITOPS_HOSTNAME"
# fi

PLUGIN_NAME=$(jq -r '.name' plugin.json)

echo "Plugin Name: ${PLUGIN_NAME}"
echo "API Server: $BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT"
echo "Console Image: $CONSOLE_IMAGE"
echo "Console URL: http://localhost:${CONSOLE_PORT}"

# Prefer podman if installed. Otherwise, fall back to docker.
if [ -x "$(command -v podman)" ]; then
    if [ "$(uname -s)" = "Linux" ]; then
        # Use host networking on Linux since host.containers.internal is unreachable in some environments.
        export BRIDGE_PLUGINS="${PLUGIN_NAME}=http://localhost:9001"
        echo 'BRIDGE env vars...'
        set | grep ^BRIDGE
        podman run --pull always --rm --network=host --env "BRIDGE_*" $CONSOLE_IMAGE
    else
        export BRIDGE_PLUGINS="${PLUGIN_NAME}=http://host.containers.internal:9001"
        podman run --pull always --rm -p "$CONSOLE_PORT":9000 --env "BRIDGE_*" $CONSOLE_IMAGE
    fi
else
    BRIDGE_PLUGINS="${PLUGIN_NAME}=http://host.docker.internal:9001"
    docker run --pull always --rm -p "$CONSOLE_PORT":9000 --env-file <(set | grep BRIDGE) $CONSOLE_IMAGE
fi
