var express = require('express');
var node_excel = require('excel-export');
var fs = require('fs');

var app = express();

var queries = Object.create(null);

var query_info = require('./queries.json');
var selected_study='';

study_sites = {
    'NAPLS3':['UCLA', 'Emory', 'Harvard', 'Hillside', 'UNC', 'UCSD', 'Calgary', 'Yale', 'UCSF'],
    'ReGroup':['Calgary', 'Hillside', 'UCSD'],
    'PROCAN': ['Calgary', 'Sunnybrook']
};

query_info.forEach( function(file) {
    file["fxn"] = require( file.script_path );
    if (file.url.length == 1)
        file["queries"] = file["fxn"].check_data(file.url[0]);
    else
        file["queries"] = file["fxn"].check_data(file.url[0], file.url[1]);
    
    console.log(file.study, '-', file.name, ':', file.queries.length);
});

app.use(express.static('public'));
//app.set('views', './views');

app.get('/study/:study', function(req, res){
    selected_study=req.params.study;
    console.log("Selected study:", selected_study);
    if (selected_study=='select'){
        res.render('index.jade');
    } else {
        res.render('template.jade');
    }        
});

app.get('/info', function(req, res){
    res.send({'study':selected_study,
              'sites':study_sites[selected_study]});
});

app.get('/queries', function(req, res){
    var query_names = query_info.filter( function(entry) {
        return entry.study==selected_study;
    } ).map( function (q) { return q.name; } );
    
    res.send(query_names);
});

app.get('/queries/:name', function(req, res){
    console.log("Got request for", selected_study, "-", req.params.name);
    var found = false;
    var study_queries = query_info.filter( function(q) {return q.study==selected_study;});
    for (var i=0; i<study_queries.length; i++){    
        if ( study_queries[i].name == req.params.name ){
            found = true;
            res.send(study_queries[i].queries);
            break;
        }
    }
    if (!found){
        console.log("404 - not found");
    }
});

app.get('/Excel', function(req, res){
    console.log('Got a request to download all the queries in .xlsx format!');
    
    site_names = study_sites[selected_study];
     
    for (var i=0; i<site_names.length; i++){
        var sheets = [];
        
        console.log("Site:", site_names[i]);
        for (var j=0; j<query_info.length; j++){
            
            if (query_info[j].study!=selected_study)
                continue;
            else {
                var conf = {};
                conf.name = query_info[j].name;
                conf.cols = [{caption: 'ID', type: 'string'}, 
                            {caption: 'Visit', type: 'string'}, 
                            {caption: 'Field', type: 'string'}, 
                            {caption: 'Query', type: 'string'}, 
                            ];
                
                conf.rows = [];
                if (query_info[j].queries.length!=0){       
                    var site_queries = query_info[j].queries.filter( function (q) { 
                        return q.site==i+1;
                    });
                    if (site_queries.length>0){
                        site_queries.forEach( function (q) {
                            conf.rows.push( [q.id, 
                                             q.visit,
                                             q.field,
                                             q.query] );
                        });
                    } else {
                        conf.rows.push(['N/A', 'N/A', 'N/A', "No queries for this measure!"]);
                    }    
//                    for (var k=0; k<query_info[j].queries.length; k++){
//                        if (query_info[j].queries[k].site==i+1){
//                            conf.rows.push( [query_info[j].queries[k].id, 
//                                             query_info[j].queries[k].visit,
//                                             query_info[j].queries[k].field,
//                                             query_info[j].queries[k].query] );
//                        }
//                    }           
                } else {
                    conf.rows = [['N/A', 'N/A', 'N/A', "No queries for this measure!"]];
                }
                console.log(conf.name, ':', conf.rows.length);
                sheets.push(conf);
            }
        }
        
        var result = node_excel.execute(sheets);
        var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var now = new Date();        
        var filename = 'output/' + selected_study + '_' + site_names[i] + '_' + monthNames[now.getMonth()] + now.getFullYear() +'.xlsx';
      	fs.writeFileSync(filename, result, 'binary');
      	console.log("Wrote queries for " + site_names[i] + " to " + filename);
  	}
});

app.listen(3000, function(){
    console.log("Listening on port 3000");
});
