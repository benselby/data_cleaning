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
            for (var i=0; i<data.length; i++) {
                var row_ind = get_row(data[i], raw_data.data);
                
                if (data[i].cbi_head_injury=='0'){
                    var others = ['cbi_age_first_injury','cbi_age_last_injury','cbi_num_injuries'];
                    for (j in others){
                        if (data[i][others[j]]!='')
                            queries.push(rf.make_query(data[i], others[j], "Should be N/A given no head injury history", row_ind));
                    }
                    if (data[i].cbi_severe_rating!='1')
                        queries.push(rf.make_query(data[i], 'Item 5 - Severity', "Should be 1 given no head injury history", row_ind));
                }
                else if (data[i].cbi_head_injury=='1'){
                    var others = ['cbi_age_first_injury','cbi_age_last_injury','cbi_num_injuries'];
                    for (j in others){
                        if (data[i][others[j]]=='')
                            queries.push(rf.make_query(data[i], others[j], "Can't be N/A given head injury history", row_ind));
                    }
                    
                    if (data[i].cbi_severe_rating=='1')
                        queries.push(rf.make_query(data[i], 'Item 5 - Severity', "Should not be 1 given prior head injury", row_ind));
                }                 
                                
                if (data[i].cbi_severe_rating=='6')
                    queries.push(rf.make_query(data[i], 'Item 5 - Severity', "High severity head injury", row_ind));                                  
            }
        }
        
        return queries;        
    }
}
