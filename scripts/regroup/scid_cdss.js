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

remission_codes = ['296.25','296.26','296.35','296.36'];

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
                    
                    if (cdss_data[i].C_CDSTOTAL>9){
                        var scid_row = get_row(cdss_data[i], raw_scid.data) - 2;
                        if (raw_scid.data[ scid_row ].scid_mood_depression=='71.9')
                            queries.push(rf.make_query(cdss_data[i], 'SCID Current Depressive Disorder', "Possible missing depression code given CDSS score > 9", scid_row+2));
                    }
                    else {
                        var scid_row = get_row(cdss_data[i], raw_scid.data) - 2;
                        if (scid_row < 0){
                            console.log('Could not find matching SCID data for CDSS row %d, skipping!', i+2);
                            continue;
                        } else {
                            if (raw_scid.data[ scid_row ].scid_mood_depression!='71.9' && remission_codes.indexOf(raw_scid.data[ scid_row ].scid_mood_depression) == -1)                        
                                queries.push(rf.make_query(cdss_data[i], 'CDSS Total Score', "Possible inappropriate code given CDSS score < 10", scid_row+2));
                        }
                    }                
                }
            }
        }        
        return queries;        
    }
}
