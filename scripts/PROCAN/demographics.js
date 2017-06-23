var Baby = require("babyparse");
var util = require('util');
var fs = require('fs');
var rf = require('../reports');

function check_birth_year(array, raw_data, queries) {
    for (var i=0; i<array.length; i++){
        var birth_date = new Date( array[i]['demo_dob'].replace(/-/g, ' ') );
        var birth_year = birth_date.getFullYear();
        var row_ind = rf.get_data_row( array[i].SiteNumber, array[i].SubjectNumber, raw_data.data );
        if (birth_year>2008) {
            var q_str = "Birth year of " + birth_year + " is inadmissable";
            queries.push(rf.make_query(array[i], 'demo_dob', q_str, row_ind));
        }        
    }
}

module.exports = {
    check_data: function(url) {
        
        var raw_data, data;
        var queries = [];
        
        raw_data = Baby.parseFiles( url, {header: true} );
            
        data = rf.filter(raw_data.data, function(pt){
            return pt.DataQuality==3||pt.DataQuality==4||pt.DataQuality==5
        });
        
        var m_data = Baby.parseFiles( '../Missing_Data.csv', {header:true} ).data;
        var miss_data = [];
        
//        if (m_data.length==0)
//            console.log( "Demographics: failed to load missing data sheet! Proceeding");
//        else {        
//            miss_data = m_data.filter( function(row) { return row.TASK_NAME=='Demographics'; } ); 
//            if (miss_data.length==0)
//                console.log( "Demographics: found no missing data - proceeding without.");
//        }
                
        check_birth_year(data, raw_data, queries);
        rf.check_date_diff( data, 'demo_dob', 'DataCollectedDate', 'demo_age_ym', raw_data, queries);
        rf.check_date_diff( data, 'demo_dad_dob', 'DataCollectedDate', 'demo_dad_age', raw_data, queries);
        rf.check_date_diff( data, 'demo_mom_dob', 'DataCollectedDate', 'demo_mom_Age', raw_data, queries);
        
        return queries;
    }
}
