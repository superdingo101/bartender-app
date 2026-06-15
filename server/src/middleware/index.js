const cors = require('cors');
const express = require('express');
const logger = require('./logger');
const { corsOptions } = require('../config/cors');

module.exports = (app) => {
  app.use(logger);
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
};
