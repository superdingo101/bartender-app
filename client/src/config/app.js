const runtimeConfig =
  typeof window !== 'undefined' ? window.__RUNTIME_CONFIG__ : undefined;

export const APP_NAME =
  runtimeConfig?.REACT_APP_BARTENDING_COMPANY ||
  process.env.REACT_APP_BARTENDING_COMPANY ||
  'The Bartending App';

export default APP_NAME;
