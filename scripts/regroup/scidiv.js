var Baby = require("babyparse");
var util = require('util');
var fs = require('fs');
var rf = require('../reports');

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
            
        data = rf.filter_data_quality(raw_data.data);
        
        if (data.length>1){
            // Run the rest of the data checks here
            
            data.forEach( function(row) {
                var row_ind = get_row(row, raw_data.data);
                
                if ( row.scid_diag_psych_disorder!='71.9') {
                    if (row.VisitLabel!='C' && row.VisitLabel!='PC')
                        queries.push(rf.make_query(row, 'Psychotic diagnosis code', "Participant should be labelled conversion with a SCID diagnosis.", row_ind));          
                } 
            });
        }
        return queries;
    }
}
