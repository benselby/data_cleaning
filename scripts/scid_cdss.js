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
    check_data: function(scid_url, cdss_url) {
        
        var raw_scid, scid_data, raw_cdss, cdss_data;
        var queries = [];
        
        raw_scid = Baby.parseFiles( scid_url, {header: true} );
        scid_data = rf.filter_data_quality(raw_scid.data);
        
        raw_cdss = Baby.parseFiles( cdss_url, {header: true} );
        cdss_data = rf.filter_data_quality(raw_cdss.data);
        
        if (cdss_data.length>1){
            // Run the rest of the data checks here
            for (var i=0; i<cdss_data.length; i++) {
                if (cdss_data[i].VisitLabel=='BL' || cdss_data[i].VisitLabel=='C'){
                    var cdss_row = get_row(cdss_data[i], raw_cdss.data);
                    
                    if (cdss_data[i].C_CDSTOTAL>8){
                        var scid_row = get_row(cdss_data[i], raw_scid.data) - 2;
                        if (raw_scid.data[ scid_row ].scid_mood_depression=='71.9')
                            queries.push(rf.make_query(cdss_data[i], 'SCID Current Depressive Disorder', "Possible missing code given CDSS score > 8", scid_row+2));
                    }                
                }
            }
        }        
        return queries;        
    }
}
