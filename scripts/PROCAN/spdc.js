var Baby = require("babyparse");
var util = require('util');
var fs = require('fs');
var rf = require('../reports');

module.exports = {
    check_data: function(url) {
        
        var raw_data, data;
        var queries = [];
        
        raw_data = Baby.parseFiles( url, {header: true} );
            
        data = rf.filter_data_quality(raw_data.data);
        
        if (data.length>1){
            var bad = [];
            for (var i=0; i<data.length; i++) {
                var keys = [data[i]['SPDC_01'],
                           data[i]['SPDC_02'],
                           data[i]['SPDC_03'],
                           data[i]['SPDC_04'],
                           data[i]['SPDC_05'],
                           data[i]['SPDC_06'],
                           data[i]['SPDC_07'],
                           data[i]['SPDC_08'],
                           data[i]['SPDC_09']];
                var sum = keys.map( function(value){
                    return parseInt(value);
                } ).reduce( function(a,b) {
                    return a+b;
                });
                
                if ((sum < 5 && data[i]['SPDC_10'] == '1') || (sum > 4 && data[i]['SPDC_10'] == '0'))
                bad.push( rf.get_row({"SiteNumber":data[i].SiteNumber,
                                      "SubjectNumber":data[i].SubjectNumber,
                                      "VisitLabel":data[i].VisitLabel}, 
                                      raw_data.data)); 
            }
            
        }
        return queries;
    }
}
