const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const axios = require('axios');
const fs = require('fs');
const cors = require('cors');
const sql = require('mssql');
const config = require('./config/DB');
var Item;

const app = express();
app.use(bodyParser.urlencoded({ extended: false}));
app.use(cors());
app.use(express.static('public'));

app.set('view engine', 'pug');
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/about', (req, res) => {
  res.render('card', {prompt: "Guys"});
});

app.get('/hello', (req, res) => {
  res.render('hello');
});

app.post('/hello', (req, res) => {
  res.render('hello', { name: req.body.username });
});

app.listen(3000, () => {
  console.log('The application is running on localhost.');
});


// PULL BACK ALL CONTACTS WITH ACCOUNT NUMBER AND SAVE IN A VARIABLE  - DONEEE
////////////////////////////////////////////////////////////////////////
function writeMeJesus() {
	fs.writeFile('2018contact.js', json, 'utf8');
}

function helloWork(vid, cb) {
	axios.get('https://api.hubapi.com/contacts/v1/lists/all/contacts/all?hapikey=09c5f18b-d855-4d83-a770-063d908f9466&property=account_number&count=100&vidOffset=' + vid + '')
		.then(function (response) {
			console.log(response.data.contacts);

      json = " ," + JSON.stringify(response.data.contacts);
      
      fs.appendFile("2018contact.js", json, function(err){
        if(err) throw err;
        console.log('IS WRITTEN');
      });
			if (response.data['has-more']) {
				helloWork(response.data['vid-offset']);
			}
		})
		.catch(function (error) {
			console.log(error);
		});

	//if (cb && typeof (cb) === "function") {
	//	writeMeJesus();
	//}
}

function exeQuery() {
	sql.connect(config, err => {
		new sql.Request().query("select requestorid from SWCCNLRQR", (err, result) => {
			//error checks  
			//console.log(result);
			Item = JSON.stringify(result.recordset);
			Item = JSON.parse(Item.replace(/"\s+|\s+"/g,'"'));
			Item = JSON.stringify(Item);
			console.log(Item);
		//	fs.writeFile('querydata.js', Item, 'utf8', (error) => {
		//		if (error)
		//		 console.log(error);
		//	});
		});
	});
}

function readWriteSync() {
  var newJson = fs.readFileSync('querydata.js', 'utf-8');
  newJson = JSON.parse(newJson);
  var arrays = [], size = 100;

  while (newJson.length > 0)
    arrays.push(newJson.splice(0, size));
  
  console.log(arrays.length);
  arrays = JSON.stringify(arrays);
  fs.writeFile('netlink_logins.js', arrays, 'utf8');
}
//helloWork(0);
exeQuery();