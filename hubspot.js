const https = require('https');
const axios = require('axios');
const fs = require('fs');

//const file = fs.createWriteStream('contact.js');
const hostname = '127.0.0.1';
const port = 3000;

const server = https.createServer((req, res) => {
	res.statusCode = 200;
//	res.setHeader('Content-Type', 'text/plain');
	res.end('Hello World\n');
});

server.listen(port, hostname, () => {
	console.log(`Server running at https://${hostname}:${port}/`);
});


// PULL BACK ALL CONTACTS WITH ACCOUNT NUMBER AND SAVE IN A VARIABLE  - DONEEE
////////////////////////////////////////////////////////////////////////
/*
function writeMeJesus() {
	fs.writeFile('2018contact.js', json, 'utf8');
}
var json = "";

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

helloWork(0);
*/
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

// query _data  --  contacts_all  --  updated_json
// RUN QUERY FOR 2016 SALES AND CONVERT INTO A JSON OBJECT SAVE OBJECT IN A VARIABLE. ----  DONEEE
/*
var cntr = 0;
var updated_json = [];
var data = fs.readFileSync('2018contact.js', 'utf-8');
data = JSON.parse(data);

var query_data = fs.readFileSync('netlink_logins.js', 'utf-8');
query_data = JSON.parse(query_data);
data.forEach(function (batch) {
	batch.forEach(function (contact) {
    cntr++;
    console.log(contact.properties.account_number.value);  
    query_data.forEach(function (item) {
      if (contact.properties.account_number.value === item.customernumber.toString()) {
        console.log("HI! I updated " + item.customernumber + " and also " + contact.properties.account_number.value + " " + cntr);
        updated_json.push({"vid": contact.vid.toString(), "properties": [ { "property": "laurajanelle_com_login", "value": item.username } ] });
        
        if(cntr === 2376) {
        	updated_json = JSON.stringify(updated_json);
        	console.log(updated_json);
        	fs.writeFile('hubspotLogins.js', updated_json, 'utf8');
        }
        console.log(cntr);
      }
    });
  });
});
*/

var cntr = 0;
var updated_json = [];
var data = fs.readFileSync('webinfo.js', 'utf-8');
data = JSON.parse(data);

var query_data = fs.readFileSync('itemjson.js', 'utf-8');
query_data = JSON.parse(query_data);
data.forEach(function (batch) {
  cntr++;  
  query_data.forEach(function (item) {

    if (batch.itemnum === item.Item) {
      console.log("HI! I updated " + item.Item + " and also " + batch.itemnum + " " + cntr);
      updated_json.push({"itemnum":item.Item,"location":"800","shortdesc":batch.shortdesc,"shortdesc2":batch.shortdesc2,"dimensions":batch.dimensions,"oldwholprice":item.Wholesale});
      
      if(cntr === 1286) {
        updated_json = JSON.stringify(updated_json);
        console.log(updated_json);
        fs.writeFile('wholesaleprice.js', updated_json, 'utf8');
      }
      //console.log(cntr);
    }
    
  });
});


////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

// MODIFY THE QUERY JSON OBJECT TO BE FORMATTED FOR IMPORT INTO HUBSPOT
/*
function readWriteSync() {
  var newJson = fs.readFileSync('hubspotLogins.js', 'utf-8');
  newJson = JSON.parse(newJson);
  var arrays = [], size = 100;

  while (newJson.length > 0)
    arrays.push(newJson.splice(0, size));
  
  console.log(arrays.length);
  arrays = JSON.stringify(arrays);
  fs.writeFile('netlink_logins.js', arrays, 'utf8');
}

readWriteSync();
*/


////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

// LOOP QUERY JSON OBJECT AND ADD IN THE SALES DATA FOR THE APPROPIATE 
/*
var newJson = fs.readFileSync('netlink_logins.js', 'utf-8');
newJson = JSON.parse(newJson);
newJson.forEach (function (input, index) {
  console.log(input.length);
  setTimeout(function () {
    axios({
      method: 'POST',
      url: 'https://api.hubapi.com/contacts/v1/contact/batch/?hapikey=09c5f18b-d855-4d83-a770-063d908f9466',
      data:  input
    })
    .then(function (response) {
      console.log(response.status);
    })
    .catch(function (error) {
      console.log(error.IncomingMessage);
    });
  }, index * 3000);
});
*/








/*
var formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  // the default value for minimumFractionDigits depends on the currency
  // and is usually already 2
});
var counter = 0;
var updated_json = [];
var newJson = fs.readFileSync('newerJson.js', 'utf-8');
newJson = JSON.parse(newJson);
newJson.forEach (function (input) {
  input.forEach(function (contact, index) {
    counter++;
    contact.properties[1].value = formatter.format(contact.properties[1].value);
 
    updated_json.push({"vid": contact.vid, "properties": [{"property": "n2016_number_of_orders", "value" : contact.properties[0].value },{"property": "n2016_total_sales", "value": contact.properties[1].value}] });
  });
   if (counter === 897) {
    updated_json = JSON.stringify(updated_json);
    console.log(updated_json);
    fs.appendFile("2016newerJson.js", updated_json, function(err){
      if(err) throw err;
      console.log('IS WRITTEN');
    });
  }
 console.log(counter);
});
*/