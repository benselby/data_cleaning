var express = require('express');
var node_excel = require('excel-export');
var fs = require('fs');
//var xl = require('msexcel-builder');
var xl = require('excel4node');
var Promise = require('es6-promise').polyfill();

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

//app.get('/Excel', function(req, res){
//    console.log('Got a request to download all the queries in .xlsx format!');
//    
//    site_names = study_sites[selected_study];
//     
//    for (var i=0; i<site_names.length; i++){
//        var sheets = [];
//        
//        console.log("Site:", site_names[i]);
//        for (var j=0; j<query_info.length; j++){
//            
//            if (query_info[j].study!=selected_study)
//                continue;
//            else {
//                var conf = {};
//                conf.name = query_info[j].name;
//                conf.cols = [{caption: 'ID', type: 'string'}, 
//                            {caption: 'Visit', type: 'string'}, 
//                            {caption: 'Field', type: 'string'}, 
//                            {caption: 'Query', type: 'string'}, 
//                            ];
//                
//                conf.rows = [];
//                if (query_info[j].queries.length!=0){       
//                    var site_queries = query_info[j].queries.filter( function (q) { 
//                        return q.site==i+1;
//                    });
//                    if (site_queries.length>0){
//                        site_queries.forEach( function (q) {
//                            console.log(typeof q.id, typeof q.visit, typeof q.field, typeof q.query);
//                            conf.rows.push( [q.id, 
//                                             q.visit,
//                                             q.field,
//                                             q.query] );
//                        });
//                    } else {
//                        conf.rows.push(['N/A', 'N/A', 'N/A', "No queries for this measure!"]);
//                    }    
////                    for (var k=0; k<query_info[j].queries.length; k++){
////                        if (query_info[j].queries[k].site==i+1){
////                            conf.rows.push( [query_info[j].queries[k].id, 
////                                             query_info[j].queries[k].visit,
////                                             query_info[j].queries[k].field,
////                                             query_info[j].queries[k].query] );
////                        }
////                    }           
//                } else {
//                    conf.rows = [['N/A', 'N/A', 'N/A', "No queries for this measure!"]];
//                }
//                console.log(conf.name, ':', conf.rows.length);
//                sheets.push(conf);
//            }
//        }
//        
//        var result = node_excel.execute(sheets);
//        var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
//  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//        var now = new Date();        
//        var filename = 'output/' + selected_study + '_' + site_names[i] + '_' + monthNames[now.getMonth()] + now.getFullYear() +'.xlsx';
//      	fs.writeFileSync(filename, result, 'binary');
//      	console.log("Wrote queries for " + site_names[i] + " to " + filename);
//  	}
//});

//app.get('/Excel', function(req, res){
//    console.log('Got a request to download all the queries in .xlsx format!');
//    
//    site_names = study_sites[selected_study];
//    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
//                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//                           
//    for (var i=0; i<site_names.length; i++){
//        
//        var now = new Date();        
//        var filename = selected_study + '_' + site_names[i] + '_' + monthNames[now.getMonth()] + now.getFullYear() +'.xlsx';
//        var workbook = xl.createWorkbook('./output', filename);
//        
//        console.log("Site:", site_names[i]);
//        
//        var measures = query_info.filter( function (m) {  
//            return m.study==selected_study; 
//        });
//        
//        measures.forEach( function(measure) {
//            var site_queries = measure.queries.filter( function(q){
//                return q.site==i+1;
//            });
//            
//            console.log("creating sheet for ", measure.name);
//            var sheet = workbook.createSheet(measure.name, 4, site_queries);
//            
//            console.log(workbook);
//            
//            console.log('setting some headers');
//            sheet.set(1,1,'ID');
//            sheet.set(2,1,'Visit');
//            sheet.set(3,1,'Field');
//            sheet.set(4,1,'Query');
//            
//            console.log('filling the sheet');
//            if (site_queries.length > 0){
//                site_queries.forEach( function(q, k) {
//                    sheet.set(1, k+2, q.id);
//                    sheet.set(2, k+2, q.visit);
//                    sheet.set(3, k+2, q.field);
//                    sheet.set(4, k+2, q.query);
//                });
//            } else {
//                sheet.set(1,2,'N/A');
//                sheet.set(2,2,'N/A');
//                sheet.set(3,2,'N/A');
//                sheet.set(4,2,'No queries for this measure');
//            }                        
//        });
//        
//        workbook.save( function (ok) {
//            if (!ok) {
//                console.log("Error while saving the workbook!");
//                workbook.cancel();
//            } else 
//                console.log("success!");
//        });

//        console.log("Wrote queries for " + site_names[i] + " to " + filename);
//  	}
//});

app.get('/Excel', function(req, res){
    console.log('Got a request to download all the queries in .xlsx format!');
    
    site_names = study_sites[selected_study];
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                           
    for (var i=0; i<site_names.length; i++){
        
        var now = new Date();        
        var filename = selected_study + '_' + site_names[i] + '_' + monthNames[now.getMonth()] + now.getFullYear() +'.xlsx';
        var workbook = new xl.Workbook();
        
        console.log("Site:", site_names[i]);
        
        var measures = query_info.filter( function (m) {  
            return m.study==selected_study; 
        });
        
        measures.forEach( function(measure) {
            var site_queries = measure.queries.filter( function(q){
                return q.site==i+1;
            });
            
            var sheet = workbook.addWorksheet(measure.name);
            
            sheet.cell(1,1).string('ID');
            sheet.cell(1,2).string('Visit');
            sheet.cell(1,3).string('Field');
            sheet.cell(1,4).string('Query');
            
            if (site_queries.length > 0){
                site_queries.forEach( function(q, k) {
                    sheet.cell(k+2,1).string(q.id);
                    sheet.cell(k+2,2).string(q.visit);
                    sheet.cell(k+2,3).string(q.field);
                    sheet.cell(k+2,4).string(q.query);
                });
            } else {
                sheet.cell(2,1).string('N/A');
                sheet.cell(2,2).string('N/A');
                sheet.cell(2,3).string('N/A');
                sheet.cell(2,4).string('No queries for this measure');
            }                        
        });
        
        workbook.write('./output/'+filename);

        console.log("Wrote queries for " + site_names[i] + " to " + filename);
  	}
});

app.listen(3000, function(){
    console.log("Listening on port 3000");
});
