const https  = require('https');
const axios  = require('axios');
const fs     = require('fs');
const cors   = require('cors');
const sql    = require('mssql');
const mysql  = require('mysql');
const dbconfig = require('./config/DB');
const cousindbconfig = require('./config/CousinDB');
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
    .query("SELECT vItemNumber, itemprice_2 from [dbo].[CCA_ITEM_DESCRIPTIONS] LEFT JOIN dbo.SWCCSSTOK ON dbo.CCA_ITEM_DESCRIPTIONS.vItemNumber = dbo.SWCCSSTOK.stocknumber AND dbo.CCA_ITEM_DESCRIPTIONS.vLocation = dbo.SWCCSSTOK.locationnumber where [vShowOnSite] LIKE '%Y%' AND [vLocation] LIKE '%800%'");
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

//getProducts();
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

//updateDescQuery();