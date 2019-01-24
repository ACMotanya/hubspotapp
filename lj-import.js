const https  = require('https');
const axios  = require('axios');
const fs     = require('fs');
const cors   = require('cors');
const sql    = require('mysql');
const dbconfig = require('./config/DB');
//const cousindbconfig = require('./config/CousinDB');
const dotenv = require('dotenv').config();
const hostname = '127.0.0.1';
const port = 3000;

const server = https.createServer((req, res) => {
	res.statusCode = 200;
  //res.setHeader('Content-Type', 'text/plain');
	res.end('Hello World\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at https://${hostname}:${port}/`);
});



function getProducts() {
  sql.connect(dbconfig).then(pool =>  {
    return pool.request()
    .query("SELECT dbo.cca_item_descriptions.vitemnumber AS vItemNumber, dbo.cca_item_descriptions.vlocation AS vLocation, dbo.cca_item_descriptions.vdescription AS vDescription, dbo.cca_item_descriptions.vshortdesc AS vShortDesc, dbo.cca_item_descriptions.vlook AS vLook, dbo.cca_item_descriptions.vspecificcolor AS vSpecificColor, dbo.cca_item_descriptions.vgencolor AS vGenColor, dbo.cca_item_descriptions.vgenmaterial AS vGenMaterial, dbo.cca_item_descriptions.vgenitemtype AS vGenItemType, dbo.cca_item_descriptions.vshape AS vShape, dbo.cca_item_descriptions.vsizetype AS vSizetype, dbo.cca_item_descriptions.vmetalcolor AS vMetalColor, dbo.cca_item_descriptions.vmetaltype AS vMetalType, dbo.cca_item_descriptions.vdimensions AS vDimensions, dbo.cca_item_descriptions.vpccounts AS vPcCounts, dbo.cca_item_descriptions.vkeywords AS vKeywords, dbo.cca_item_descriptions.vonsale AS vOnSale, dbo.cca_item_descriptions.vfeatureditem  AS vFeaturedItem, dbo.cca_item_descriptions.vsorting AS vSorting, dbo.cca_item_descriptions.vaggregation AS vAggregation,dbo.cca_item_descriptions.vEvents AS vEvents, dbo.cca_item_descriptions.vDetailDesc AS vDetailDesc, dbo.cca_item_descriptions.vFeatureDesc AS vFeatureDesc, dbo.cca_item_descriptions.vID AS vID, dbo.cca_item_descriptions.vLastUpdated AS vLastUpdated, dbo.cca_item_descriptions.vLastUpdated AS vLastUpdated, dbo.cca_item_descriptions.vMaterialDesc  AS vMaterialDesc, dbo.cca_item_descriptions.vShowOnSite AS vAShowOnSite, FROM dbo.cca_item_descriptions WHERE dbo.cca_item_descriptions.vshowonsite = 'Y' AND dbo.cca_item_descriptions.vlocation = '800'");
  }).then(result => {
      items = JSON.stringify(result.recordset);
			items = JSON.parse(items.replace(/"\s+|\s+"/g,'"'));

      fs.writeFile('items800.js', JSON.stringify(items), 'utf8', (error) => {
        if (error)
          console.log(error);
      });
  }).then(() => {
    sql.close();
  }).catch(err => {
    // ... error checks
    console.log(err);
	});
	
  sql.on('error', err => {
    // ... error handler
    console.log(err);
  });
}

getProducts();
/*
var connection = mysql.createConnection({
	host: '192.169.139.196',
	user: 'cousinrw',
	password: 'Cousin_789',
	database: 'CousinDB'
});

function updateDescQuery() {
	connection.connect();
  var sortdata = fs.readFileSync('items800.js', 'utf-8');
  sortdata = JSON.parse(sortdata);

  Object.keys(sortdata).forEach(function (k) {
  	connection.query("UPDATE `CousinDB`.`SWCCSSTOK` set `CousinDB`.`SWCCSSTOK`.itemprice_2 = '" + sortdata[k].itemprice_2 + "' WHERE `CousinDB`.`SWCCSSTOK`.stocknumber = '" + sortdata[k].vItemNumber + "' and `CousinDB`.`SWCCSSTOK`.locationnumber = '800'", (error, results, fields) => {
  		if (error) throw error;
    });
  });
}
*/
//updateDescQuery();