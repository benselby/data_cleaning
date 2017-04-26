var Baby = require("babyparse");
var util = require('util');
var fs = require('fs');
var rf = require('./reports');

function get_row( row, raw_data ){
    return rf.get_row({"SiteNumber":row.SiteNumber,
                       "SubjectNumber":row.SubjectNumber,
                       "VisitLabel":row.VisitLabel}, 
                       raw_data);
}

module.exports = {
    check_data: function(scid_url, spdc_url) {
        
        var raw_scid, scid_data, raw_spdc, spdc_data;
        var queries = [];
        
        raw_scid = Baby.parseFiles( scid_url, {header: true} ).data;
        scid_data = rf.filter_data_quality(raw_scid);
        
        raw_spdc = Baby.parseFiles( spdc_url, {header: true} ).data;
        spdc_data = rf.filter_data_quality(raw_spdc);
        
        if (scid_data.length>1){
            // Run the rest of the data checks here
            scid_data.forEach( function( scid_row ) {
                var spdc_ind = get_row( scid_row, raw_spdc ) - 2; 
                var scid_ind = get_row( scid_row, raw_scid ) - 2;            
                                                
                if (spdc_ind == -3) {
                   console.log("SCID_SPDC: no matching Conv row found for SCID row", scid_ind+2);
                   return;
                }            
                
                var spdc_row = raw_spdc[spdc_ind];
                
                if (spdc_row===undefined){
                    console.log("WTF - SCID row:",scid_ind+2, " - SPD row: ", spdc_ind+2);
                    return;
                }
                
                var spdc_items =['SPDC_01','SPDC_02','SPDC_03','SPDC_04',
                                'SPDC_05','SPDC_06','SPDC_07',
                                'SPDC_08','SPDC_09','SPDC_10'];
                var count = 0;
                spdc_items.forEach( function (item) {
                    if (spdc_row[item]=='1')
                        count++;
                });
                
                if (scid_row.scid_schizotypal=='71.9'){                    
                    if (count >= 5)
                        queries.push(rf.make_query(scid_row, 'SCID Schizotypal code', "Possibly missing given total SPDC > 4",scid_ind+2));
                } 
                else if (scid_row.scid_schizotypal!=''){
                    if (count < 5)
                        queries.push(rf.make_query(scid_row, 'SCID Schizotypal code', "Possibly incorrect given total SPDC < 5",scid_ind+2));
                }
            });
        }        
        return queries;        
    }
}
