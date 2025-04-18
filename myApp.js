require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
let bodyParser = require('body-parser');
const dns = require('node:dns');

// ket noi toi mongo db
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));
// tao 1 schema voi cac thuoc tinh tuong ung
  const URLSchema = new mongoose.Schema({
    original_url: {type: String, required: true, unique: true},
    short_url: {type: Number, required: true, unique: true}
  })
// tao 1 instance 
  const URLModel = mongoose.model('url', URLSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended : true}))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/shorturl/:short_url', function(req, res) {
  let short_url = req.params.short_url; 
  URLModel.findOne({short_url: short_url}).then( (foundURL) => {
    if(foundURL){
      let original_url = foundURL.original_url;
      res.redirect(original_url);
    } else {
      res.json({message: "The short url does not exist!"})
      }
  })
})

app.post('/api/shorturl', (req,res) => {
   let url = req.body.url;
  try{
    urlObj = new URL(url);
    console.log(urlObj);

    // kiem tra url co hop le hay khong
    dns.lookup(urlObj.hostname, (err, address, family) => {
      if(!address){
        res.json({error: 'Invalid url'})
      } else {
        let original_url = urlObj.href;

        // kiem tra url da ton tai hay chua, co thi se chuyen huong toi url,
        // khong thi se tao moi 1 short_url tuong ung
        URLModel.findOne({original_url: original_url}).then( (foundURL) => {
          if(foundURL) {
            res.redirect(foundURL.original_url);
          } else {
              let short_url = 1;
                URLModel.find({}).sort({short_url: 'desc'}).limit(1).then( (lastestURL) => {
                    if(lastestURL.length > 0) {
                      short_url = parseInt(lastestURL[0].short_url) + 1;
                    }
                    resObj = {
                      original_url: original_url,
                      short_url: short_url
                    }            
                      let newURL = new URLModel(resObj);
                      newURL.save();
                      res.json(resObj);
                      console.log(resObj)
                  })
            }
        })
      }
     })
  }
  catch{
    res.json({error: 'Invalid url'})
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});



module.exports = app;