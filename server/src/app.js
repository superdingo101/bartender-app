const express = require('express');
const middleware = require('./middleware');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

middleware(app);
routes(app);
app.use(errorHandler.notFound);
app.use(errorHandler.errorHandler);

module.exports = app;
