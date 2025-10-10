const cors = require('cors');
const express = require('express');
const logger = require('./logger');

module.exports = (app) => {
  app.use(logger);
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
};
