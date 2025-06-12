const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');

const setupExpress = (app) => {
  // Sett opp EJS som view engine
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../../views'));

  // Bruk layouts
  app.use(expressLayouts);
  app.set('layout', 'layout');

  // Cookie parser
  app.use(cookieParser());

  // Statiske filer
  app.use(express.static(path.join(__dirname, '../../public')));
  
  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
};

module.exports = { setupExpress }; 