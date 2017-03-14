var express = require('express');
var node_excel = require('excel-export');
var fs = require('fs');

var app = express();

var queries = Object.create(null);

var query_info = require('./queries.json');

query_info.forEach( function(file) {
    file["fxn"] = require( file.script_path );
    if (file.url.length == 1)
        file["queries"] = file["fxn"].check_data(file.url[0]);
    else
        file["queries"] = file["fxn"].check_data(file.url[0], file.url[1]);
    
    console.log(file.name, ':', file.queries.length);
});

app.use(express.static('public'));

app.get('/', function(req, res){
    res.sendFile('public/index.html');
});

app.get('/queries', function(req, res){
    var query_names = query_info.map( function (q) { return q.name; } );
    res.send(query_names);
});

app.get('/queries/:name', function(req, res){
    console.log("Got request for", req.params.name);
    var found = false;
    for (var i=0; i<query_info.length; i++){    
        if ( query_info[i].name == req.params.name ){
            found = true;
            res.send(query_info[i].queries);
            break;
        }
    }
    if (!found){
        console.log("404 - not found");
    }
    
});

app.get('/Excel', function(req, res){
    console.log('Got a request to download all the queries in .xlsx format!');
    
    site_names = {1:'UCLA',
             2:'Emory',
             3:'Harvard',
             4:'Hillside',
             5:'UCSD',
             6:'UNC',
             7:'Calgary',
             8:'Yale',
             9:'UCSF'};
     
    for (var i=1; i<=9; i++){
        var sheets = [];
        for (var j=0; j<query_info.length; j++){
            var conf = {};
            conf.name = query_info[j].name;
            conf.cols = [{caption: 'ID', type: 'string'}, 
                        {caption: 'Visit', type: 'string'}, 
                        {caption: 'Field', type: 'string'}, 
                        {caption: 'Query', type: 'string'}, 
                        ];
            
            conf.rows = [];
            if (query_info[j].queries.length!=0){            
                for (var k=0; k<query_info[j].queries.length; k++){
                    if (query_info[j].queries[k].site==i){
                        conf.rows.push( [query_info[j].queries[k].id, 
                        query_info[j].queries[k].visit,
                        query_info[j].queries[k].field,
                        query_info[j].queries[k].query] );
                    }
                }           
            } else {
                conf.rows = [[null, null, null, null]];
            }
            
            sheets.push(conf);        
        }       
        var result = node_excel.execute(sheets);
        var filename = 'output/' + site_names[i] + '.xlsx';
      	fs.writeFileSync(filename, result, 'binary');
      	console.log("Wrote queries for " + site_names[i] + " to " + filename);
  	}
});

app.listen(3000, function(){
    console.log("Listening on port 3000");
});
