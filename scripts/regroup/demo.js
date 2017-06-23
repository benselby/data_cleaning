var Baby = require("babyparse");
var util = require('util');
var fs = require('fs');
var rf = require('../reports');

field_dict = {'demo_dad_dob':'Napls3Demo.Demo_19',
            'demo_mom_dob':'Napls3Demo.Demo_21'};

function check_DOB( array, target, raw_data, queries, miss_data ) {
    var bad = [];
    for (var i=0; i<array.length; i++){
        var row_ind = rf.get_data_row( array[i].SiteNumber, array[i].SubjectNumber, raw_data.data );
        if (array[i][target].substring(0,2) != '15') {
            if (array[i][target]=='') {
                var obj_name = 'NAPLS3-0' + array[i].SiteNumber + '-0' + array[i].SubjectNumber;
                var fields = miss_data.filter(function(row){ 
                        return row.CALC_OBJECT_NAME==obj_name; 
                    });
                if ( fields.length > 0 ) {
//                    console.log("Demographics: missing data approved for " + obj_name);
                    continue;
                } else
                    queries.push(rf.make_query(array[i], target, "Should not be blank without corresponding missing code V3", row_ind));    
            }         
//            else     
//                queries.push(rf.make_query(array[i], target, "Day of date should be 15", row_ind));
        }
    }
};

function check_birth_year(array, raw_data, queries) {
    var fields = ['demo_dob', 'demo_mom_dob', 'demo_dad_dob'];
    
    for (var i=0; i<array.length; i++){
        for (var j=0; j<fields.length; j++){
                var birth_date = new Date( array[i][fields[j]].replace(/-/g, ' ') );
                var birth_year = birth_date.getFullYear();
                var row_ind = rf.get_data_row( array[i].SiteNumber, array[i].SubjectNumber, raw_data.data );
                if (birth_year>2008) {
                    var q_str = "Birth year of " + birth_year + " is inadmissable";
                    queries.push(rf.make_query(array[i], fields[j], q_str, row_ind));
                }        
        }
    }
    
}

module.exports = {
    check_data: function(url) {
        
        rf.init_report("Demographics",'./reports/ClientInfo.txt', url);

        var raw_data, data;
        var queries = [];
        
        raw_data = Baby.parseFiles( url, {header: true} );
            
        data = rf.filter(raw_data.data, function(pt){
            return pt.DataQuality==3||pt.DataQuality==4||pt.DataQuality==5
        });
        
        var m_data = Baby.parseFiles( './data/Missing_Data.csv', {header:true} ).data;
        var miss_data = [];
        
        if (m_data.length==0)
            console.log( "Demographics: failed to load missing data sheet! Proceeding");
        else {        
            miss_data = m_data.filter( function(row) { return row.TASK_NAME=='Demographics'; } ); 
            if (miss_data.length==0)
                console.log( "Demographics: found no missing data - proceeding without.");
        }
                
        if (data.length < 1) {
            rf.write_report( "No rows with appropriate data quality found." );
            return -1;
        } else {
            rf.write_report( util.format( "Using %d of %d rows based on data quality levels 3,4,5", data.length, raw_data.data.length-1));
        }
        
        check_birth_year(data, raw_data, queries);
        check_DOB(data, "demo_dob", raw_data, queries, miss_data);
        rf.check_date_diff( data, 'demo_dob', 'DataCollectedDate', 'demo_age_ym', raw_data, queries);
        check_DOB(data, "demo_dad_dob", raw_data, queries, miss_data);
        rf.check_date_diff( data, 'demo_dad_dob', 'DataCollectedDate', 'demo_dad_age', raw_data, queries);
        check_DOB(data, "demo_mom_dob", raw_data, queries, miss_data);
        rf.check_date_diff( data, 'demo_mom_dob', 'DataCollectedDate', 'demo_mom_Age', raw_data, queries);
        
        return queries;
    }
}
