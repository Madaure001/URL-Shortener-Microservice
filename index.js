require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
let bodyParser = require('body-parser');
let mongoose = require('mongoose');

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
                    original: {
                      type: String,
                      required: true
                    },
                    short: {type : Number}     //to enable us to get the original from the short
})

let Url = mongoose.model('Url', urlSchema);

let responseObject = {};

app.post('/api/shorturl', bodyParser.urlencoded({extended: false}), (req, res) => {

  let inputUrl = req.body['url']

  let urlRegex = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi)

  //check the validity of the url
  if(!inputUrl.match(urlRegex)){
    res.json({error: 'Invalid URL'})
    return
  }

  responseObject['original_url'] = inputUrl
  //find the highest shorturl number and update for new entries

  let inputShort = 1
  Url.findOne({})
      .sort({short: 'desc'})      
      .exec((error, result)=> {
        if (!error && result != undefined){   //increment the short url for none empty DB
          inputShort = result.short + 1
        }
        if(!error){
          Url.findOneAndUpdate(   //update for entries that already exist in DB
            {original: inputUrl},
            {original: inputUrl, short: inputShort},
            {new: true, upsert: true},
            (error, savedUrl) => {
              if(!error){
                responseObject['short_url'] = savedUrl.short
                res.json(responseObject)
              }
            }
          )
        }
      })  
})

app.get('/api/shorturl/:input', (req, res) => {
  
  let input = req.params.input

  
  Url.findOne({short: input}, (error, result) => {
    if(!error && result != undefined){
      res.redirect(result.original)
    }else{
      res.json('URL not found')
    }
  })
})


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
