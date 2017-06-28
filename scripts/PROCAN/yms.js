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
            data.forEach( function(pt) {
                var row_ind = get_row(pt, raw_data.data);
                if (pt.ymrs_11=='4'){
                    queries.push(rf.make_query(pt, 'Insight Score', "Please verify insight score of 4", row_ind));
                }
            });
        }
        
        return queries;        
    }
}
