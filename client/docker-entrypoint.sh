#!/bin/sh
set -eu

escaped_api_url=$(printf '%s' "${REACT_APP_API_URL:-}" | sed 's/\\/\\\\/g; s/"/\\"/g')
escaped_company=$(printf '%s' "${REACT_APP_BARTENDING_COMPANY:-}" | sed 's/\\/\\\\/g; s/"/\\"/g')

cat > /usr/share/nginx/html/runtime-config.js <<CONFIG
window.__RUNTIME_CONFIG__ = {
  REACT_APP_API_URL: "${escaped_api_url}",
  REACT_APP_BARTENDING_COMPANY: "${escaped_company}"
};
CONFIG

exec "$@"
