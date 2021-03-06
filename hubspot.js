const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const axios = require('axios');
const fs = require('fs');
const cors = require('cors');
const sql = require('mssql');
const config = require('./config/DB');
const dotenv = require('dotenv').config();
var Item;
var json = [];
const hapikey = process.env.HAPIKEY;
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

app.get('/save', function (req, res) {
  fs.writeFile('log.txt', 'This is my text', function (err) {
    if (err) throw err;
    console.log('Replaced!');
    res.send('Replaced!');
  });
});


// PULL BACK ALL CONTACTS WITH ACCOUNT NUMBER AND SAVE IN A VARIABLE  - DONEEE
////////////////////////////////////////////////////////////////////////
/*
1) helloWork                --> Pull back contacts and save in file so I can correlate the VID from HubSpot and Account # in Southware. Save in contact.js  ASYNC
2) exeQuery                 --> Run query against SWDB and get all the contacts that have orders and need to be updated that day. SYNC
3) customerUpdate           --> Run query against SWDB and get aggregated order data for each customer that was pulled back in the exeQuery function SYNC
4) formatSalesDataForUpload --> Create a file or variable to hold data that is formatted so it can be uploaded to HubSpot. - SYNC
5) readWriteBatch           --> If hubspot upload is bigger than 100 records, you must run this function and batch the records in array of 100 elements. 
6) hubspotUpload            --> Grabs the file or variable and uploads the changes to HubSpot!!
7) gageBuilder              --> Builds the task engagements and upload them to hubspot
*/
var formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  // the default value for minimumFractionDigits depends on the currency
  // and is usually already 2
});
function helloWork(vid) {
  axios.get('https://api.hubapi.com/contacts/v1/lists/all/contacts/all?hapikey='+ hapikey +'&property=account_number&property=hubspot_owner_id&count=100&vidOffset=' + vid + '')
    .then(function (response) {
      contacts = response.data.contacts;
      contacts.forEach( function (contact) {
        if (contact.properties.account_number) {
          console.log(contact.properties.lastmodifieddate.value);
          if (contact.properties.hubspot_owner_id) {         
            json.push({"vid": contact.vid, "account_number": contact.properties.account_number.value, "hubspot_owner_id": contact.properties.hubspot_owner_id.value });
          } else {
            json.push({"vid": contact.vid, "account_number": contact.properties.account_number.value, "hubspot_owner_id": "30951267" });
          }
        }
      });s
      
<<<<<<< HEAD
			if (response.data['has-more']) {
        json.push(", ");
=======
      if (response.data['has-more']) {
>>>>>>> c56138aff552a8aaec24a858f6d053d2e555fc12
        setTimeout(function () {
          helloWork(response.data['vid-offset']);
        }, 1000);
      } else {
        json = JSON.stringify(json);
        fs.appendFile("contact.js", json, function(err){
          if(err) throw err;
          console.log('IT IS WRITTEN');
          exeQuery("04/03/2018");
        });
      }
    })
<<<<<<< HEAD
		.catch(function (error) {
			console.log(error);
		});
	//if (cb && typeof (cb) === "function") {
	//	writeMeJesus();
	//}
}

helloWork(0);


////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

// Get customer number and invoice number from query.
=======
    .catch(function (error) {
      console.log(error);
    });
}

>>>>>>> c56138aff552a8aaec24a858f6d053d2e555fc12
var customersToUpdate = [];

function exeQuery(date) {
	sql.connect(config).then(() =>  {
    var request = new sql.Request();
    request.query("SELECT a.ordernumber, a.invoicedate, a.totalprice, a.customernumber, a.invoicenumber, stuff((select ' ' + LTRIM(RTRIM(c.trackingnumber))+ ' ' from SWCCSSBOX c where a.invoicenumber = c.invoicenumber and c.boxnumber = 1 FOR XML PATH('')) ,1,1,'') AS TrackingInfo, stuff((select ' ' + LTRIM(RTRIM(c.shipmethod))+ ' ' from SWCCSSBOX c where a.invoicenumber = c.invoicenumber and c.boxnumber = 1 FOR XML PATH('')) ,1,1,'') AS MethodInfo From dbo.SWCCSHST1 a Left Outer Join dbo.HubSpotPushOrders b on a.ordernumber = b.OrderNumber Where (b.OrderNumber is null) and (a.invoicedate = '" + date + "') and (locationnumber = '800') order by a.ordernumber", (err, result) => {
      item = JSON.stringify(result.recordset);
      item = JSON.parse(item.replace(/"\s+|\s+"/g,'"'));
      console.log(item);
      Object.keys(item).forEach(function(k){
        if (item[k].TrackingInfo) {
          item[k].TrackingInfo = item[k].TrackingInfo.split("  ");
        } else {
          item[k].TrackingInfo = ["None Provided"];
        }
        if (item[k].MethodInfo)
          item[k].MethodInfo = item[k].MethodInfo.split("  ");
      });
      
      fs.writeFile('querydata.js', JSON.stringify(item), 'utf8', (error) => {
        if (error)
          console.log(error);
        console.log("exeQuery Complete");
        customerUpdate();
      });
    });
  });
}

var itemsProcessed = 0;
// counter.
function customerUpdate() {
  var customerdata = fs.readFileSync('querydata.js', 'utf-8');
  customerdata = JSON.parse(customerdata);
  console.log(customerdata);
  //sql.connect(config, err => {
    var request2 = new sql.Request();
    Object.keys(customerdata).forEach(function(k){
	// console.log(customerdata[k].customernumber);                          
      request2.query("SELECT t.customernumber, sum(tprice)as TSales, sum(tcnt) as TOrders from ( SELECT a.customernumber, sum(totalprice)as TPrice,Sum(totalcost) as TCost,Sum(totaldiscountamt) as TDisc, count(totalprice)as tcnt, b.emailaddress FROM SWCCSHST1 a left outer join swccrcust b on a.customernumber = b.customernumber where Year(invoicedate) = '2018' and (totalcost <> 0) and ((OrderType ='R') Or (OrderType = 'H')) and locationnumber = '800' and LTRIM(RTRIM(b.customernumber))  = '"+ customerdata[k].customernumber +"' group by a.customernumber, b.emailaddress UNION ALL select c.customernumber, sum(totalprice)as TPrice,Sum(totalcost) as TCost,Sum(totaldiscount) as TDisc, count(totalprice)as tcnt, d.emailaddress from SWCCSBIL1 c left outer join swccrcust d on c.customernumber = d.customernumber where Year(orderdate) = '2016' and (totalcost <> 0) and ((OrderType ='R') Or (OrderType = 'H')) and locationnumber = '800' and LTRIM(RTRIM(d.customernumber))  = '"+ customerdata[k].customernumber +"' group by c.customernumber, d.emailaddress) t group by t.customernumber, t.emailaddress order by t.customernumber", (err, result) => {
        itemsProcessed++;
        custitem = JSON.stringify(result.recordset);
        customersToUpdate.push(custitem);
        console.log(customersToUpdate);
        if(itemsProcessed === customerdata.length) {
          fs.writeFile('dailyQuerydata.js', JSON.stringify(customersToUpdate), 'utf8', (error) => {
            if (error)
            console.log(error);
            console.log("customerUpdate Complete");
            formatSalesDataForUpload();
          });
        }
      });
    });
 // });
}


//FORMATS DATA SO I CAN IMPORT INTO HUBSPOT FOR THE DAILY SALES DATA ONLY
//NEEDS LOGGING INFORMATION IF CUSTOMER IS NOT IN THE HUBSPOT
var cntr = 0;
var updated_json = [];
function formatSalesDataForUpload() {
  var data = fs.readFileSync('contact.js', 'utf-8');
  data = JSON.parse(data);
  console.log(data.length);
  var query_data = fs.readFileSync('dailyQuerydata.js', 'utf-8');
  query_data = JSON.parse(query_data);

  data.forEach(function (batch) {
    cntr++;

    query_data.forEach(function (item) {
      item = JSON.parse(item);
      if (batch.account_number === item[0].customernumber.trim()) {
        console.log("HI! I updated " + item[0].customernumber + " and also " + batch.account_number + " " + cntr);
        updated_json.push({"vid": batch.vid, "properties": [{"property": "n2018_number_of_orders", "value" : item[0].TOrders },{"property": "n2018_total_sales", "value": formatter.format(item[0].TSales)},{"property": "hubspot_owner_id", "value": batch.hubspot_owner_id}] });
      }
    });

    console.log(cntr);
    if(cntr === data.length) {
      //updated_json = JSON.stringify(updated_json);
      console.log(updated_json);
      fs.writeFile('contactOrderData.js', JSON.stringify(updated_json), 'utf8', (error) => {
        if (error)
          console.log(error);
        console.log("format complete");
        hubspotUpload();
      });
    }
  });
}

// MODIFY THE QUERY JSON OBJECT TO BE FORMATTED FOR IMPORT INTO HUBSPOT
// ONLY ALLOWED TO BATCH 100 RECORDS AT A TIME TO HUBSPOT THIS FUNCTION 
// DIVIDES THE ALL CONTACTS INTO ARRAYS OF 100 AT THE MOST.
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

function hubspotUpload() {
  var newJson = fs.readFileSync('contactOrderData.js', 'utf-8');
  newJson = JSON.parse(newJson);
	axios({
		method: 'POST',
		url: 'https://api.hubapi.com/contacts/v1/contact/batch/?hapikey=09c5f18b-d855-4d83-a770-063d908f9466',
		data:  newJson
	})
	.then(function (response) {
    console.log(response);
    gageBuilder();
	})
	.catch(function (error) {
		console.log(error.IncomingMessage);
  });
}


////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
// BUILD TASK ENGAGEMENTS JSON FOR THE ORDERS INVOICED THAT DAY.
counter = 0;

function gageBuilder() {
  var gager = fs.readFileSync('contact.js', 'utf-8');
  gager = JSON.parse(gager);
  var dailyorders = fs.readFileSync('querydata.js', 'utf-8');
  dailyorders = JSON.parse(dailyorders);

  Object.keys(gager).forEach(function(k) {
    counter++;
    Object.keys(dailyorders).forEach(function (order, index) {
      if (gager[k].account_number === dailyorders[order].customernumber) {
        reminder = Date.now() + 604800000;
        duedate = Date.now() + 1209600000;
        setTimeout(function () {
          axios({
            method: 'POST',
            url: 'https://api.hubapi.com/engagements/v1/engagements?hapikey=09c5f18b-d855-4d83-a770-063d908f9466',
            data: 
              { "engagement": 
                { "active": true,
                  "ownerId": gager[k].hubspot_owner_id,
                  "type": "TASK",
                  "timestamp": duedate
                },
                "associations": {
                    "contactIds": [gager[k].vid]
                },
                "metadata": {
                  "body": "Call and confirm she received shipment of order " + dailyorders[order].ordernumber + ". Tracking number(s): " + dailyorders[order].TrackingInfo.join("  ") +".",
                  "subject": "Reason for Call: Confirm Order Receipt",
                  "status": "NOT_STARTED",
                  "forObjectType": "CONTACT",
                  "taskType": "CALL",
                  "reminders": [reminder],
                  "sendDefaultReminder": true
                }
              }
          })
          .then(function (response) {
            console.log(response.status);
          })
          .catch(function (error) {
            console.log(error.IncomingMessage);
          });
        }, index * 1500);
      }
    });
  });
}
//helloWork(0);
//exeQuery("4/5/2018");
//gageBuilder();

