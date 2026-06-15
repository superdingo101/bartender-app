const trimTrailingSlashes = (value) => value.replace(/\/+$/, '');

export const API_BASE_URL = trimTrailingSlashes(process.env.REACT_APP_API_URL || '');

export const apiUrl = (path) => `${API_BASE_URL}${path}`;

export default API_BASE_URL;
