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
    check_data: function(scid_url, conv_url) {
        
        var raw_scid, scid_data, raw_conv, conv_data;
        var queries = [];
        
        raw_scid = Baby.parseFiles( scid_url, {header: true} ).data;
        scid_data = rf.filter_data_quality(raw_scid);
        
        raw_conv = Baby.parseFiles( conv_url, {header: true} ).data;
        conv_data = rf.filter_data_quality(raw_conv);
        
        if (conv_data.length>1){
            // Run the rest of the data checks here
            conv_data.forEach( function( conv_row ) {
                var conv_ind = get_row( conv_row, raw_conv ) - 2; 
                var scid_ind = get_row( conv_row, raw_scid ) - 2;            
                                                
                if (scid_ind == -1) {
                   console.log("SCID_Conversion: no matching SCID row found - skipping row ", scid_ind+2);
                   return;
                }
                
                if (raw_scid[scid_ind].DataQuality < 3){
                    console.log("SCID_Conversion: corresponding SCID data quality is < 3 - skipping row", scid_ind+2);
                    return;
                }         
                
                var scid_row = raw_scid[scid_ind];               
                if (conv_row.diagnosis_determination=='1' || conv_row.diagnosis_determination=='2'){
                    if (scid_row.scid_diag_psych_disorder=='71.9' || scid_row.scid_diag_psych_disorder=='')
                        queries.push(rf.make_query(scid_row, 'SCID psychotic code', "Missing given that diagnosis determination was based on SCID/SOPS", scid_ind+2));
                }                    
            });
        }        
        return queries;        
    }
}
