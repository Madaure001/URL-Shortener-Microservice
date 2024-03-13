require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
let bodyParser = require('body-parser');
let mongoose = require('mongoose');
const validURL = require('valid-url');


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


// Your first API endpoint

let urlSchema = new mongoose.Schema({
                    //store original URL
                    originalURL: {
                      type: String,
                      required: true
                    },
                    shortURL: {type: Number},     //to enable us to get the original from the short
})

let URL = mongoose.model('URL', urlSchema);

// Response for POST request
app.post('/api/shorturl/', bodyParser.urlencoded({extended: false}), async (req, res) => {

  const { url } = req.body;
  const shortURL = Math.floor(Math.random()*1000);
  console.log(validURL.isUri(url));

    //.save does not accpet callbacks
  if (validURL.isWebUri(url) === undefined) {
    res.json({
        error: 'invalid url',
      });
  } else {
    try {
      let findOne = await URL.findOne({
        originalURL: url,
      });
      if (findOne) {
        res.json({
          original_url: findOne.originalURL,
          short_url: findOne.shortURL,
        });
      } else {
        findOne = new URL({
          originalURL: url,
          shortURL,
        });
        await findOne.save();
        res.json({
            original_url: findOne.originalURL,
            short_url: findOne.shortURL,
          });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json('Server error..');
    }
  }
  });
  
  // Redirect shortened URL to Original URL
  app.get('/api/shorturl/:shortURL?', async (req, res) => {
    try {
      const urlParams = await URL.findOne({
        shortURL: req.params.shortURL,
      });
      if (urlParams) {
        return res.redirect(urlParams.originalURL);
      }
      return res.status(404).json('No URL found');
    } catch (err) {
      console.log(err);
      res.status(500).json('Server error..');
    }
  });


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
