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
        
        rf.init_report("COGDIS", './reports/COGDIS.txt', url);
        
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
                
                var a_items = ['cogids_01','cogids_02','cogids_03',
                                'cogids_04','cogids_05','cogids_06',
                                'cogids_07','cogids_08','cogids_09'];
                var count = 0;
                for (j in a_items){
                    if (count==2)
                        break;
                    if (data[i][a_items[j]] >= 3)
                        count++; 
                }
                if (count==2 && data[i].cogdis_10!='1')
                    queries.push(rf.make_query(data[i], 'Item B', "Should be Yes (1) given 2 A items are 3 or higher", row_ind));        
                
                if (data[i].cogdis_12!='1' && data[i].cogdis_10=='1' && data[i].cogdis_11=='1')                  
                    queries.push(rf.make_query(data[i], 'Item D', "Should be Yes (1) given items B and C are Yes", row_ind));        
            }
        }
        
        return queries;        
    }
}
