var express = require('express');

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

app.listen(3000, function(){
    console.log("Listening on port 3000");
});
