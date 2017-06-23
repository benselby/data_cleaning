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
        
        var raw_data, data;
        
        var queries = [];
        
        raw_data = Baby.parseFiles( url, {header: true} ); 
            
        data = rf.filter_data_quality(raw_data.data);
        
        if (data.length>1){
            // Run the rest of the data checks here
            
            data.forEach( function(row) {
                var row_ind = get_row(row, raw_data.data);
                
//                if (row.VisitLabel!='T'){
//                    if ( row.scid_diag_psych_disorder!='71.9') {
//                        queries.push(rf.make_query(row, 'Psychotic diagnosis code', "Participant should be labelled Transition given DSM code "+ row.scid_diag_psych_disorder, row_ind)); 
//                    }
//                    if ( ['296.23','296.33'].indexOf(row.scid_mood_depression)!=-1 ){
//                        queries.push(rf.make_query(row, 'Major depression diagnosis code', "Participant should be labelled Transition given DSM code "+ row.scid_mood_depression, row_ind)); 
//                    }
//                    
//                    if ( ['71.9','296.80','296.89'].indexOf(row.scid_bipolar)==-1 ){
//                        queries.push(rf.make_query(row, 'Bipolar diagnosis code', "Participant should be labelled Transition given DSM code "+ row.scid_bipolar, row_ind)); 
//                    }
//                    
//                } 
                
                var field_str = '';
                var desc_str = ''; 
                if ( row.scid_diag_psych_disorder!='71.9') {
                    field_str = "Psychotic diagnosis code";
                    desc_str = "Participant has psychotic DSM code " + row.scid_diag_psych_disorder + " - please verify";
                    queries.push(rf.make_query(row, field_str, desc_str, row_ind));
                }
                
                if ( row.scid_mood_depression!='71.9') {
                    field_str = "Depression diagnosis code";
                    desc_str = "Participant has depression DSM code " + row.scid_mood_depression + " - please verify";
                    queries.push(rf.make_query(row, field_str, desc_str, row_ind));
                }             
                
                if ( row.scid_bipolar!='71.9') {
                    field_str = "Bipolar diagnosis code";
                    desc_str = "Participant has bipolar DSM code " + row.scid_bipolar + " - please verify";
                    queries.push(rf.make_query(row, field_str, desc_str, row_ind));
                }
                
            });
        }
        return queries;
    }
}
