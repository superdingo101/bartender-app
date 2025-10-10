const { getHealth } = require('./health.controller');

describe('Health Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn()
    };
  });

  it('should return health status', () => {
    getHealth(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'OK',
        message: expect.any(String),
        timestamp: expect.any(String),
        database: expect.any(String),
        environment: expect.any(String)
      })
    );
  });
});