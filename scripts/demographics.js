var Baby = require("babyparse");
var util = require('util');
var fs = require('fs');
var rf = require('./reports');

function check_DOB( array, target, raw_data ) {
    var bad = [];
    for (var i=0; i<array.length; i++){
        if (array[i][target].substring(0,2) != '15') 
            bad.push( rf.get_data_row( array[i].SiteNumber, array[i].SubjectNumber, raw_data.data ) );
    }
    if (bad.length > 0)
        rf.write_report( util.format("Birth day (%s) not 15 for the following %d rows: %s ", target, bad.length,  bad.toString() ));
    else
        rf.write_report( util.format("All %s are in format \'15-XX-XXXX\'", target));
};

module.exports = {
    check_data: function(url) {
        
        rf.init_report("Demographics",'./reports/ClientInfo.txt', url);

        var raw_data, data;
        
        raw_data = Baby.parseFiles( url, {header: true} );
        if (raw_data.errors) {
            console.log("Parsed file %s and found the following error:", url);
            console.log( "\"", raw_data.errors[0].message, "\"" );
        } else
            console.log( "Parsed file %s and found no errors.", url );  
            
        data = rf.filter(raw_data.data, function(pt){
            return pt.DataQuality==3||pt.DataQuality==4||pt.DataQuality==5
        });

            
        if (data.length < 1) {
            rf.write_report( "No rows with appropriate data quality found." );
            return -1;
        } else {
            rf.write_report( util.format( "Using %d of %d rows based on data quality levels 3,4,5", data.length, raw_data.data.length-1));
        }
        
        check_DOB(data, "demo_dob", raw_data);
        rf.check_date_diff( data, 'demo_dob', 'DataCollectedDate', 'demo_age_ym', raw_data);
        check_DOB(data, "demo_dad_dob", raw_data);
        rf.check_date_diff( data, 'demo_dad_dob', 'DataCollectedDate', 'demo_dad_age', raw_data);
        check_DOB(data, "demo_mom_dob", raw_data);
        rf.check_date_diff( data, 'demo_mom_dob', 'DataCollectedDate', 'demo_mom_Age', raw_data);
    }
}
