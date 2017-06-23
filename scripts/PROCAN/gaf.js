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
            
            var has_12 = data.filter( function(pt) {
                return pt.VisitLabel=='12'
            });
            
            var bad = [];
            for (var i=0; i<has_12.length; i++){
                var bl = rf.get_row_data({"SiteNumber":has_12[i].SiteNumber,
                                          "SubjectNumber":has_12[i].SubjectNumber,
                                          "VisitLabel":"BL"}, 
                                          data);
                
                var bl_date = new Date(bl.DataCollectedDate.replace(/-/g," "));
                var mo12_date = new Date(has_12[i].DataCollectedDate.replace(/-/g, " "));
                var time_diff = mo12_date.getTime() - bl_date.getTime();
                var diff_days = Math.floor(time_diff / (1000*3600*24) );
                
                if (diff_days < 396) {
                    if (bl.gaf_01 != has_12[i].gaf_02){
                        bad.push( rf.get_row({"SiteNumber":has_12[i].SiteNumber,
                                              "SubjectNumber":has_12[i].SubjectNumber,
                                              "VisitLabel":"BL"}, 
                                              raw_data.data));                                           
                       var row_ind = rf.get_row({"SiteNumber":has_12[i].SiteNumber,
                                              "SubjectNumber":has_12[i].SubjectNumber,
                                              "VisitLabel":"12" },
                                              raw_data.data)
                       queries.push( rf.make_query(has_12[i], 'GAF score 12 months ago', "Does not match baseline score of "+bl.gaf_01, row_ind ) );
                    }
                }
                else
                    console.log('GAF: Cannot compare GAF score for ' + bl.SiteNumber +'_'+ bl.SubjectNumber+ ' due to late 12mo assessment.'); 
            }
            
        }
        return queries;
    }
}
