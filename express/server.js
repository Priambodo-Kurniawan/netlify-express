'use strict';
const express = require('express');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

let url =
  'https://spreadsheets.google.com/feeds/list/1J3qw1ONH-Om2qfjSemzeAdLutZmuC_D1LRynm_f35Vs/od6/public/basic?alt=json';

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
  axios
    .get(url)
    .then(response => {
      let sheets = response.data.feed.entry;
      if (sheets.length) {
        let arr = [];
        sheets.forEach(data => {
          let obj = {};
          obj.data = data.content.$t.split(', column').forEach((d, idx) => {
            let temp = d.split(': ');
            if (idx == 0) {
              obj[temp[0].split('column')[1]] = temp[1];
            } else {
              obj[temp[0]] = temp[1];
            }
          });
          arr.push(obj);
        });
        res.json(arr);
      }
    })
    .catch(err => {
      res.send(err);
    });
});

app.use(bodyParser.json());
app.use('/.netlify/functions/server', router); // path must route to lambda

module.exports = app;
module.exports.handler = serverless(app);
