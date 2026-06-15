const trimTrailingSlashes = (value) => value.replace(/\/+$/, '');

const runtimeApiUrl =
  typeof window !== 'undefined'
    ? window.__RUNTIME_CONFIG__?.REACT_APP_API_URL
    : undefined;

export const API_BASE_URL = trimTrailingSlashes(
  runtimeApiUrl ?? process.env.REACT_APP_API_URL ?? ''
);

export const apiUrl = (path) => `${API_BASE_URL}${path}`;

export default API_BASE_URL;
