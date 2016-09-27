var Baby = require("babyparse");
var util = require('util');
var fs = require('fs');
var rf = require('./reports');

module.exports = {
    check_data: function(url) {
        
        rf.init_report("SCID-IV", './reports/SCIDIV.txt', url);
        
        var raw_data, data;
        
        raw_data = Baby.parseFiles( url, {header: true} );
        if (raw_data.errors) {
            console.log("Parsed file %s and found the following error:", url);
            console.log( "\"", raw_data.errors[0].message, "\"" );
        } else
            console.log( "Parsed file %s and found no errors.", url );  
            
        data = rf.filter_data_quality(raw_data.data);
        
        if (data.length>1){
            // Run the rest of the data checks here
        }
    }
}
