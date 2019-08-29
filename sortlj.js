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


function showDictionary() {
  var categories = fs.readFileSync('ljdictionary.json', 'utf-8');
  categories = JSON.parse(categories);
  //console.log(categories.look.rglb);
  Object.keys(categories).forEach(function (param, index) {
    console.log(categories[param].rglb);
  });
}
//showDictionary();



function descQuery(date) {
	sql.connect(config).then(() =>  {
    var request = new sql.Request();
    request.query("select dbo.CCA_ITEM_DESCRIPTIONS.vItemNumber AS vItemNumber, dbo.CCA_ITEM_DESCRIPTIONS.vDescription AS vDescription from dbo.CCA_ITEM_DESCRIPTIONS where vLocation = '800' AND vShowOnSite = 'Y' AND vGenItemType LIKE '%programs%' OR vGenItemType LIKE '%assortments%'", (err, result) => {
      items = JSON.stringify(result.recordset);
      items = JSON.parse(items.replace(/"\s+|\s+"/g,'"'));
      fs.writeFile('desc.js', JSON.stringify(items), 'utf8', (error) => {
        if (error)
          console.log(error);
        console.log("Query Complete");
      });
    });
  });
}
//descQuery();

function exeQuery(date) {
	sql.connect(config).then(() =>  {
    var request = new sql.Request();
    request.query("SELECT dbo.CCA_ITEM_DESCRIPTIONS.vItemNumber AS item, dbo.CCA_ITEM_DESCRIPTIONS.vLook AS look, dbo.CCA_ITEM_DESCRIPTIONS.vGenItemType AS type, dbo.CCA_ITEM_DESCRIPTIONS.vGenColor AS color, dbo.CCA_ITEM_DESCRIPTIONS.vSorting AS sorting FROM dbo.cca_Item_descriptions WHERE vShowOnSite = 'Y' AND vlocation = '800'", (err, result) => {
      items = JSON.stringify(result.recordset);
      items = JSON.parse(items.replace(/"\s+|\s+"/g,'"'));
      fs.writeFile('sortdata.js', JSON.stringify(items), 'utf8', (error) => {
        if (error)
          console.log(error);
        console.log("Query Complete");
      });
    });
  });
}
//exeQuery();
var updated_json = [];
function createSortNumber() {
  var lookVal;
  var typeVal;
  var colorVal;

  var data = fs.readFileSync('sortdata.js', 'utf-8');
  data = JSON.parse(data);

  var categories = fs.readFileSync('ljdictionary.json', 'utf-8');
  categories = JSON.parse(categories);

  Object.keys(data).forEach(function(k) {
   //console.log( data[k].look );
   var lookVal = 0;
   var typeVal = 0;
   var colorVal = 0;
   var newSortVal = 999999;

   if (typeof categories.look[data[k].look] !== "undefined" ) {
     lookVal  = categories.look[data[k].look];
   }
   if (typeof categories.type[data[k].type] !== "undefined" ) {
     typeVal  = categories.type[data[k].type];
    }
    if (typeof categories.color[data[k].color] !== "undefined" ) {
     colorVal = categories.color[data[k].color];
    }
    console.log ( data[k].item + " : " + (lookVal + typeVal + colorVal));
    data[k].sorting = lookVal + typeVal + colorVal;
    updated_json.push({"item": data[k].item, "type": data[k].type, "color": data[k].color, "sorting": data[k].sorting});
  });

  fs.writeFile('newSortData.js', JSON.stringify(updated_json), 'utf8', (error) => {
    if (error)
      console.log(error);
    console.log("format complete");
  });
}
//createSortNumber();

function updateSortQuery() {
  sql.connect(config).then(() => {
    var request = new sql.Request();
    var sortdata = fs.readFileSync('newSortData.js', 'utf-8');
    sortdata = JSON.parse(sortdata);


    Object.keys(sortdata).forEach(function (k) {
     // console.log(sortdata[k].item);
      request.query("update [dbo].[CCA_ITEM_DESCRIPTIONS] set [vLastUpdated]='2018-09-19 16:30:00.0', [vSorting]='" + sortdata[k].sorting + "'  where [vItemNumber]='" + sortdata[k].item + "' and [vLocation]='800'", (err, result) => {
        console.log(result.rowsAffected + " : " + sortdata[k].item);
      });
    });
  });
}

//updateSortQuery();



function updateDescQuery() {
  sql.connect(config).then(() => {
    var request = new sql.Request();
   // request.stream = true;
    var sortdata = fs.readFileSync('desc.js', 'utf-8');
    sortdata = JSON.parse(sortdata);

    Object.keys(sortdata).forEach(function (k) {
      request.query("UPDATE dbo.CCA_ITEM_DESCRIPTIONS set vLastUpdated = '2018-11-14 16:30:00.0', vDescription = '" + sortdata[k].longdesc + "' WHERE vItemNumber = '" + sortdata[k].item + "' and vLocation = '800'", (err, result) => {
        console.log(result.rowsAffected + " : " + sortdata[k].item);
      });

    });
  });
}

//updateDescQuery();
