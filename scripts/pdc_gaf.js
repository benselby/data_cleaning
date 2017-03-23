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
    check_data: function(gaf_url, pdc_url) {
                
        var queries = [];
        
        var raw_gaf = Baby.parseFiles( gaf_url, {header: true} ).data;
        var gaf_data = rf.filter_data_quality(raw_gaf);
        
        var raw_pdc = Baby.parseFiles( pdc_url, {header: true} ).data;
        var pdc_data = rf.filter_data_quality(raw_pdc);
        
        if (pdc_data.length>1){
            // Run the rest of the data checks here
            pdc_data.forEach( function( pdc_row ) {                 
                if (pdc_row.pdc_c3=='1'){
                    
                } else if (pdc_row.pdc_c3=='0'){           
                    
                }
            }); 
        }        
        return queries;        
    }
}
