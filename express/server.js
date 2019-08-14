'use strict';
const express = require('express');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');
require('dotenv').config();

const creds = require('../client_secret.json');

async function accessSpreadsheet(callback) {
  const doc = new GoogleSpreadsheet(
    '1J3qw1ONH-Om2qfjSemzeAdLutZmuC_D1LRynm_f35Vs'
  );
  await promisify(doc.useServiceAccountAuth)(creds);
  const info = await promisify(doc.getInfo)();
  const sheet = info.worksheets[0];

  const rows = await promisify(sheet.getRows)();
  callback(rows);
}

app.use(cors());

const router = express.Router();
router.get('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<h1>Hello from Express.js!</h1>');
  res.end();
});
router.get('/another', (req, res) => res.json({ route: req.originalUrl }));
router.post('/', (req, res) => res.json({ postBody: req.body }));

router.get('/list-service', (req, res) => {
  accessSpreadsheet(function(hai) {
    res.send(hai);
  });
});

app.use(bodyParser.json());
app.use('/.netlify/functions/server', router); // path must route to lambda

module.exports = app;
module.exports.handler = serverless(app);
