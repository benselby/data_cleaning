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
    check_data: function(scid_url, aus_url) {
        
        var raw_scid, scid_data, raw_aus, aus_data;
        var queries = [];
        
        raw_scid = Baby.parseFiles( scid_url, {header: true} ).data;
        scid_data = rf.filter_data_quality(raw_scid);
        
        raw_aus = Baby.parseFiles( aus_url, {header: true} ).data;
        aus_data = rf.filter_data_quality(raw_aus);
        
        if (scid_data.length>1){
            // Run the rest of the data checks here
            scid_data.forEach( function( scid_row ) {
                var aus_ind = get_row( scid_row, raw_aus ) - 2; 
                var scid_ind = get_row( scid_row, raw_scid ) - 2;            
                                                
                if (aus_ind == -3) {
                   console.log("SCID_AUS: no matching AUS row found for SCID row", scid_ind+2);
                   return;
                }
                
                var aus_row = raw_aus[aus_ind];
                
                if (aus_row===undefined){
                    console.log("WTF - SCID row: ",scid_ind, " - AUS row: ", aus_ind);
                    return;
                }
                
                if (scid_row.scid_cannabis!='71.9' && scid_row.scid_cannabis!=''){
                    if (aus_row.AusDus3 < 3){
                        queries.push(rf.make_query(aus_row, 'AUS/DUS cannabis usage', "Usage rating low given SCID cannabis diagnosis code",aus_ind+2));
                    }
                } else {
                    if (aus_row.AusDus3 >= 3){
                        queries.push(rf.make_query(scid_row, 'SCID cannabis abuse', "Possible missing diagnosis given high AUS/DUS score (>=3)",scid_ind+2));
                    }
                }
                
                if (scid_row.scid_alcohol!='71.9' && scid_row.scid_alcohol!=''){
                    if (aus_row.AusDus2 < 3){
                        queries.push(rf.make_query(aus_row, 'AUS/DUS alcohol usage', "Usage rating low given SCID alcohol diagnosis code",aus_ind+2));
                    }
                } else {
                    if (aus_row.AusDus2 >= 3){
                        queries.push(rf.make_query(scid_row, 'SCID alcohol abuse', "Possible missing diagnosis given high AUS/DUS score (>=3)",scid_ind+2));
                    }
                }
                
            });
        }        
        return queries;        
    }
}
