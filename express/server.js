'use strict';
const express = require('express');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');
const { check, validationResult } = require('express-validator');
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
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

const router = express.Router();
router.get('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<h1>Hello from Express.js!</h1>');
  res.end();
});
router.get('/another', (req, res) => res.json({ route: req.originalUrl }));
router.post('/', (req, res) => res.json({ postBody: req.body }));

// save to spreadsheet
router.post('/submit-email', [check('email').isEmail()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  // Create a document object using the ID of the spreadsheet - obtained from its URL.
  var doc = new GoogleSpreadsheet(
    '1AdTgYxntJZ0CSiSWiaD94NPFNatahd0ms3c5UO58cso'
  );

  // Authenticate with the Google Spreadsheets API.
  doc.useServiceAccountAuth(creds, function(err) {
    // Get all of the rows from the spreadsheet.
    let timestamp = new Date();
    let answer = Math.ceil(Math.random() * 4);
    doc.addRow(1, { email: req.body.email, timestamp: timestamp }, function(
      err
    ) {
      if (err) {
        console.log(err);
      } else {
        res.send({
          status: 200,
          message: 'success',
          answer: answer
        });
      }
    });
  });
});

router.get('/list-service', (req, res) => {
  accessSpreadsheet(function(hai) {
    res.send(hai);
  });
});

app.use(bodyParser.json());
app.use('/.netlify/functions/server', router); // path must route to lambda

module.exports = app;
module.exports.handler = serverless(app);
