const { getApiInfo } = require('./api.controller');

describe('API Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn()
    };
  });

  it('should return API information', () => {
    getApiInfo(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.any(String),
        version: '1.0.0',
        endpoints: expect.any(Object),
        documentation: expect.any(String)
      })
    );
  });
});