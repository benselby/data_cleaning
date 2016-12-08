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
    check_data: function(url) {
        
        rf.init_report("SCID-IV", './reports/SCIDIV.txt', url);
        
        var raw_data, data;
        
        var queries = [];
        
        raw_data = Baby.parseFiles( url, {header: true} );
//        if (raw_data.errors) {
//            console.log("Parsed file %s and found the following error:", url);
//            console.log( "\"", raw_data.errors[0].message, "\"" );
//        } else
//            console.log( "Parsed file %s and found no errors.", url );  
            
        data = rf.filter_data_quality(raw_data.data);
        
        if (data.length>1){
            // Run the rest of the data checks here
            var row_ind = get_row(data[i], raw_data.data);
            
            if ( data[i].scid_diag_psych_disorder!='71.9') {
                if (data[i].VisitLabel!='C')
                    queries.push(rf.make_query(data[i], 'Psychotic diagnosis code', "Participant should be labelled conversion with a SCID diagnosis.", row_ind));          
            } 
        }
        return queries;
    }
}
