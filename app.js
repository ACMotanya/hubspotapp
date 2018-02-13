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
/*
1) helloWork      --> Pull back contacts and save in file so I can correlate the VID from HubSpot and Account # in Southware. Save in 2018contact.js  ASYNC
2) exeQuery       --> Run query against SWDB and get all the contacts that haves orders and need to be updated that day. SYNC
3) customerUpdate --> Run query against SWDB and get aggregated order data for each customer that was pulled back in the exeQuery function SYNC
4) 
*/

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

var customersToUpdate = [];

function exeQuery(date) {
	sql.connect(config, err => {
    var request = new sql.Request();
    
    request.query("SELECT a.ordernumber, a.customernumber From dbo.SWCCSHST1 a LEFT Outer Join dbo.HubSpotPushOrders b on a.ordernumber = b.OrderNumber Where (b.OrderNumber is null) and (a.invoicedate = '" + date + "') and (locationnumber = '800') order by a.ordernumber", (err, result) => {
    //error checks  
    //console.log(result);
      item = JSON.stringify(result.recordset);
      item = JSON.parse(item.replace(/"\s+|\s+"/g,'"'));
      item = JSON.stringify(item);
      console.log(item);
      
      fs.writeFile('querydata.js', item, 'utf8', (error) => {
        if (error)
        console.log(error);
      });
    });
  });
}

var itemsProcessed = 0;

function customerUpdate () {
  var customerdata = fs.readFileSync('querydata.js', 'utf-8');
  customerdata = JSON.parse(customerdata);
  console.log(customerdata);
  sql.connect(config, err => {
    var request = new sql.Request();
    Object.keys(customerdata).forEach(function(k){
   //   console.log(customerdata[k].customernumber);
      request.query("SELECT t.customernumber, sum(tprice)as TSales, sum(tcnt) as TOrders from ( SELECT a.customernumber, sum(totalprice)as TPrice,Sum(totalcost) as TCost,Sum(totaldiscountamt) as TDisc, count(totalprice)as tcnt, b.emailaddress FROM SWCCSHST1 a left outer join swccrcust b on a.customernumber = b.customernumber where Year(invoicedate) = '2018' and (totalcost <> 0) and ((OrderType ='R') Or (OrderType = 'H')) and locationnumber = '800' and LTRIM(RTRIM(b.customernumber))  = '"+ customerdata[k].customernumber +"' group by a.customernumber, b.emailaddress UNION ALL select c.customernumber, sum(totalprice)as TPrice,Sum(totalcost) as TCost,Sum(totaldiscount) as TDisc, count(totalprice)as tcnt, d.emailaddress from SWCCSBIL1 c left outer join swccrcust d on c.customernumber = d.customernumber where Year(orderdate) = '2016' and (totalcost <> 0) and ((OrderType ='R') Or (OrderType = 'H')) and locationnumber = '800' and LTRIM(RTRIM(d.customernumber))  = '"+ customerdata[k].customernumber +"' group by c.customernumber, d.emailaddress) t group by t.customernumber, t.emailaddress order by t.customernumber", (err, result) => {
        itemsProcessed++;
        custitem = JSON.stringify(result.recordset);
        customersToUpdate.push(custitem);
        console.log(customersToUpdate);
        if(itemsProcessed === customerdata.length) {
          fs.writeFile('2018querydata.js', JSON.stringify(customersToUpdate), 'utf8', (error) => {
            if (error)
            console.log(error);
          });
        }
      });
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
