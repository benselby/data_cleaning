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
        
        rf.init_report("AUS_DUS", './reports/AUS_DUS.txt', url);
        
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
            for (var i=0; i<data.length; i++) {
                var row_ind = get_row(data[i], raw_data.data);
                
                var drugs = ['1','2','3','4','5','6','7','8','9','10','11','12'];                               
                for (j in drugs){
                    if (data[i]['AusDus'+drugs[j]]=='1'&&data[i]['AusDusFreq'+drugs[j]]!='0')
                        queries.push(rf.make_query(data[i], 'AusDusFreq'+drugs[j], "Should be 0 given no use of drug type", row_ind));   
                    if (data[i]['AusDus'+drugs[j]]=='5')
                        queries.push(rf.make_query(data[i], 'AusDus'+drugs[j], "Drug dependence with institutionalization", row_ind));              
                    if (data[i]['AusDusFreq'+drugs[j]]=='5' && data[i]['AusDus'+drugs[j]] <= 2)
                        queries.push(rf.make_query(data[i], 'AusDus'+drugs[j], "Frequency of 5 indicates abuse (use rating should be 3 or higher)", row_ind));                                  
                }
            }
        }
        
        return queries;        
    }
}
