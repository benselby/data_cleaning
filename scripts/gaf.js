var Baby = require("babyparse");
var util = require('util');
var fs = require('fs');
var rf = require('./reports');

module.exports = {
    check_data: function(url) {
        
        rf.init_report("GAF", './reports/GAF.txt', url);
        
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
            
            var has_12 = rf.filter( data, function(pt) {
                return pt.VisitLabel=='12';
            })
            
            var bad = [];
            for (var i=0; i<has_12.length; i++){
                var bl = rf.get_row_data({"SiteNumber":has_12[i].SiteNumber,
                                          "SubjectNumber":has_12[i].SubjectNumber,
                                          "VisitLabel":"BL"}, 
                                          data);
                if (bl.gaf_01 != has_12[i].gaf_02){
                    bad.push( rf.get_row({"SiteNumber":has_12[i].SiteNumber,
                                          "SubjectNumber":has_12[i].SubjectNumber,
                                          "VisitLabel":"BL"}, 
                                          raw_data.data)); 
                }
            }
            if (bad.length>0)
                rf.write_report(util.format("12 month GAF_02 mismatch for rows %s", bad.toString()));
            else
                rf.write_report("All 12 month GAF_02 scores match baseline.");
            
        }
        return queries;
    }
}
