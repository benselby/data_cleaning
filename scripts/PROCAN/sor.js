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
            
            // Get all participants with remission timepoint
            
            var remissions = data.filter( function(pt) { 
                return pt.stage_of_risk_01=='9'; 
            });
            
            var remission_ids = [];                
            remissions.forEach( function(pt) {
                var id = pt.SiteNumber + '_' + pt.SubjectNumber;
                if (remission_ids.indexOf(id) == -1){
                    remission_ids.push(id);
                    all_pt = data.filter( function(row) { 
                        return row.SiteNumber==pt.SiteNumber && row.SubjectNumber==pt.SubjectNumber;
                    });                    
                    for (var i=all_pt.length; i>0; i--){
                        var rem_ind;
//                        if (all_pt[i].stage_of_risk_01=='9')
                    }
                }
                else {
                    return;
                }
            });
            
            data.forEach( function(row) {
                var row_ind = get_row(row, raw_data.data);
                if (row.VisitLabel=='BL'){
                    if (row.stage_of_risk_01=='9')
                        queries.push(rf.make_query(row, 'Stage of Risk', 'Cannot be in remission at baseline', row_ind));
                    
                    if (row.stage_of_risk_01=='4')
                        queries.push(rf.make_query(row, 'Stage of Risk', 'Cannot be stage 4 at baseline', row_ind));     
                }
            });
        }
        return queries;
    }
}
