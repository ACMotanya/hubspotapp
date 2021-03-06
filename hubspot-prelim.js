const https  = require('https');
const axios  = require('axios');
const fs     = require('fs');
const cors   = require('cors');
const sql    = require('mssql');
const config = require('./config/DB');
const dotenv = require('dotenv').config();

const hapikey = process.env.HAPIKEY;
const hostname = '127.0.0.1';
const port = 3000;
var item;
const server = https.createServer((req, res) => {
	res.statusCode = 200;
  //res.setHeader('Content-Type', 'text/plain');
	res.end('Hello World\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at https://${hostname}:${port}/`);
});


// PULL BACK ALL CONTACTS WITH ACCOUNT NUMBER AND SAVE IN A VARIABLE  - DONEEE
//WRITE TO FILE EVERY TIME WE RUN A HUBSPOT FUNCTION
////////////////////////////////////////////////////////////////////////
var json = [];
var formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  // the default value for minimumFractionDigits depends on the currency
  // and is usually already 2
});
function helloWork(vid, cb) {
	axios.get('https://api.hubapi.com/contacts/v1/lists/all/contacts/all?hapikey='+ hapikey +'&property=account_number&property=hubspot_owner_id&count=100&vidOffset=' + vid + '')
		.then(function (response) {
      //console.log(response.data.contacts);
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
      });
      
			if (response.data['has-more']) {
        setTimeout(function () {
          helloWork(response.data['vid-offset']);
        }, 2000);
      } else {
        json = JSON.stringify(json);
        fs.appendFile("contact.js", json, function(err){
          if(err) throw err;
          console.log('IT IS WRITTEN');
        });
      }
		})
		.catch(function (error) {
			console.log(error);
		});
	if (cb && typeof (cb) === "function") {
		cb();
	}
}

//helloWork(0);


////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

// Get customer number and invoice number from query.
//var customersToUpdate = [];

function exeQuery(date) {
	sql.connect(config, err => {
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
      });
    });
  });
}
//exeQuery("2/19/2018");
//var itemsProcessed = 0;

function customerUpdate () {
  var customerdata = fs.readFileSync('querydata.js', 'utf-8');
  customerdata = JSON.parse(customerdata);
  console.log(customerdata);
  sql.connect(config, err => {
    var request = new sql.Request();
    Object.keys(customerdata).forEach(function(k){
      //console.log(customerdata[k].customernumber);
      request.query("SELECT t.customernumber, sum(tprice)as TSales, sum(tcnt) as TOrders from ( SELECT a.customernumber, sum(totalprice)as TPrice,Sum(totalcost) as TCost,Sum(totaldiscountamt) as TDisc, count(totalprice)as tcnt, b.emailaddress FROM SWCCSHST1 a left outer join swccrcust b on a.customernumber = b.customernumber where Year(invoicedate) = '2018' and (totalcost <> 0) and ((OrderType ='R') Or (OrderType = 'H')) and locationnumber = '800' and LTRIM(RTRIM(b.customernumber))  = '"+ customerdata[k].customernumber +"' group by a.customernumber, b.emailaddress UNION ALL select c.customernumber, sum(totalprice)as TPrice,Sum(totalcost) as TCost,Sum(totaldiscount) as TDisc, count(totalprice)as tcnt, d.emailaddress from SWCCSBIL1 c left outer join swccrcust d on c.customernumber = d.customernumber where Year(orderdate) = '2016' and (totalcost <> 0) and ((OrderType ='R') Or (OrderType = 'H')) and locationnumber = '800' and LTRIM(RTRIM(d.customernumber)) = '"+ customerdata[k].customernumber +"' group by c.customernumber, d.emailaddress) t group by t.customernumber, t.emailaddress order by t.customernumber", (err, result) => {
        itemsProcessed++;
        custitem = JSON.stringify(result.recordset);
        customersToUpdate.push(custitem);
        console.log(customersToUpdate);
        if(itemsProcessed === customerdata.length) {
          fs.writeFile('dailyQueryData.js', JSON.stringify(customersToUpdate), 'utf8', (error) => {
            if (error)
            console.log(error);
          });
        }
      });
    });
  });
}
//customerUpdate();


////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
//FORMATS DATA SO I CAN IMPORT INTO HUBSPOT FOR THE DAILY SALES DATA ONLY
//NEEDS LOGGING INFORMATION IF CUSTOMER IS NOT IN THE HUBSPOT
//var cntr = 0;
//var updated_json = [];
function formatSalesDataForUpload() {
  var data = fs.readFileSync('2018contact.js', 'utf-8');
  data = JSON.parse(data);
  console.log(data.length);
  var query_data = fs.readFileSync('2018querydata.js', 'utf-8');
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
      updated_json = JSON.stringify(updated_json);
      console.log(updated_json);
      fs.writeFile('contactOrderData.js', updated_json, 'utf8');
    }
  });
}
//formatSalesDataForUpload();



//var cntr = 0;
//var updated_json = [];

function formatWholeSalePrice() {
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
}


function formatMoneyforSalesDataDaily() {
  var customerdata = fs.readFileSync('2018querydata.js', 'utf-8');
  customerdata = JSON.parse(customerdata);
  customerdata.forEach (function (input, index) {
    input = JSON.parse(input);
    counter++;
    input[0].TSales = formatter.format(input[0].TSales);

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
}


////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
//FORMATS DATA SO I CAN IMPORT INTO HUBSPOT FOR THE LOGIN INFORMATION ONLY

//var cntr = 0;
//var updated_json = [];
function formatLogin() {
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
}



////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
//FORMATS DATA SO I CAN IMPORT INTO HUBSPOT FOR THE YEARLY SALES DATA ONLY

var counter = 0;

function formatSalesDataYear() {
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
}






////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////


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
function hubspotUpload() {
  var newJson = fs.readFileSync('contactOrderData.js', 'utf-8');
  newJson = JSON.parse(newJson);
  //console.log(newJson);
  //newJson.forEach (function (input, index) {
   //console.log(input.length);
    
  //  setTimeout(function () {
      axios({
        method: 'POST',
        url: 'https://api.hubapi.com/contacts/v1/contact/batch/?hapikey='+ hapikey,
        data:  newJson
      })
      .then(function (response) {
        console.log(response);
      })
      .catch(function (error) {
        console.log(error.IncomingMessage);
      });
  //  }, index * 3000);
    
  //});
}

//hubspotUpload();

//item = JSON.parse(item.replace(/"\s+|\s+"/g,'"'));

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
// BUILD TASK ENGAGEMENTS JSON FOR THE ORDERS INVOICED THAT DAY.
counter = 0;

function gageBuilder() {
  var gager = fs.readFileSync('2018contact.js', 'utf-8');
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
            url: 'https://api.hubapi.com/engagements/v1/engagements?hapikey=' + hapikey,
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

//gageBuilder();



var cntr = 0;
var updated_json = [];

function addDesc() {
  var data = fs.readFileSync('wholesaleprice.js', 'utf-8');
  data = JSON.parse(data);

  var query_data = fs.readFileSync('itemdesc.js', 'utf-8');
  query_data = JSON.parse(query_data);
  console.log(data.length);
  data.forEach(function (batch) {
    cntr++;  
    query_data.forEach(function (item) {

      if (batch.itemnum === item.item && (batch.desc1 === "" || batch.desc1 === " ")) {
        //console.log("HI! I updated " + item.item + " and also " + batch.itenum + " " + cntr);
        updated_json.push({"itemnum":batch.itemnum,"location":"800","shortdesc":item.desc,"shortdesc2":batch.desc2,"dimensions":batch.dimensions,"oldwholprice":batch.oldwholeprice});
   //   } else {
  //      updated_json.push({"itemnum":batch.itemnum,"location":"800","shortdesc":batch.desc1,"shortdesc2":batch.desc2,"dimensions":batch.dimensions,"oldwholprice":batch.oldwholeprice});
  //    }
      }
        if(cntr === 1691) {
          //console.log(updated_json);
          fs.writeFile('wholesaleprice2.js', JSON.stringify(updated_json), 'utf8');
        }
        //console.log(cntr);
   //   }
    });
  });
  console.log("finished");
}

addDesc();