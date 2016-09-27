var Baby = require("babyparse");
var util = require('util');
var fs = require('fs');
var rf = require('./reports');

module.exports = {
    check_data: function(url) {
        
        rf.init_report("Cannabis", './reports/Cannabis.txt', url);

        var raw_data, data;
        
        raw_data = Baby.parseFiles( url, {header: true} );
        if (raw_data.errors) {
            console.log("Parsed file %s and found the following error:", url);
            console.log( "\"", raw_data.errors[0].message, "\"" );
        } else
            console.log( "Parsed file %s and found no errors.", url );  
            
        data = rf.filter(raw_data.data, function(row){
            return row.DataQuality==3
        });
            
        if (data.length < 1) {
            rf.write_report( "No rows with appropriate data quality found." );
            return -1;
        } else {
            rf.write_report( util.format( "Using %d of %d rows based on data quality", data.length, raw_data.data.length-1));
        }
        
    }
}
