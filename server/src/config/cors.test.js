/* eslint-disable global-require */
describe('CORS configuration', () => {
  const originalEnv = process.env;

  const loadCorsConfig = (env) => {
    jest.resetModules();
    process.env = { ...originalEnv, ...env };
    delete process.env.CORS_ORIGIN;
    delete process.env.CLIENT_URL;
    Object.assign(process.env, env);
    return require('./cors');
  };

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  it('does not throw for Origin requests when production allow-list is empty', (done) => {
    const { corsOptions, allowSameOriginProxyWithoutCors } = loadCorsConfig({
      NODE_ENV: 'production',
    });

    expect(allowSameOriginProxyWithoutCors).toBe(true);
    corsOptions.origin('https://bartender.example.com', (error, allowed) => {
      expect(error).toBeNull();
      expect(allowed).toBe(false);
      done();
    });
  });

  it('rejects unknown origins when a production allow-list is configured', (done) => {
    const { corsOptions } = loadCorsConfig({
      NODE_ENV: 'production',
      CORS_ORIGIN: 'https://bartender.example.com',
    });

    corsOptions.origin('https://evil.example.com', (error) => {
      expect(error).toEqual(new Error('Origin https://evil.example.com is not allowed by CORS'));
      done();
    });
  });
});
