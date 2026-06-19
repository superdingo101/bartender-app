describe('APP_NAME', () => {
  const originalRuntimeConfig = window.__RUNTIME_CONFIG__;
  const originalCompany = process.env.REACT_APP_BARTENDING_COMPANY;

  afterEach(() => {
    jest.resetModules();

    if (originalRuntimeConfig === undefined) {
      delete window.__RUNTIME_CONFIG__;
    } else {
      window.__RUNTIME_CONFIG__ = originalRuntimeConfig;
    }

    if (originalCompany === undefined) {
      delete process.env.REACT_APP_BARTENDING_COMPANY;
    } else {
      process.env.REACT_APP_BARTENDING_COMPANY = originalCompany;
    }
  });

  it('prefers the runtime-config company name', () => {
    process.env.REACT_APP_BARTENDING_COMPANY = 'Build-Time Bar';
    window.__RUNTIME_CONFIG__ = {
      REACT_APP_BARTENDING_COMPANY: 'Runtime Bar',
    };

    const { APP_NAME } = require('./app');

    expect(APP_NAME).toBe('Runtime Bar');
  });

  it('falls back to the build-time company name', () => {
    delete window.__RUNTIME_CONFIG__;
    process.env.REACT_APP_BARTENDING_COMPANY = 'Build-Time Bar';

    const { APP_NAME } = require('./app');

    expect(APP_NAME).toBe('Build-Time Bar');
  });

  it('uses the default app name when no company name is configured', () => {
    delete window.__RUNTIME_CONFIG__;
    delete process.env.REACT_APP_BARTENDING_COMPANY;

    const { APP_NAME } = require('./app');

    expect(APP_NAME).toBe('The Bartending App');
  });
});
