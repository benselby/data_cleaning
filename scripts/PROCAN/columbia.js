var Baby = require("babyparse");
var util = require('util');
var fs = require('fs');
var rf = require('../reports');

function get_row( row, raw_data ){
    return rf.get_row({"SiteNumber":row.SiteNumber,
                       "SubjectNumber":row.SubjectNumber,
                       "VisitLabel":row.VisitLabel}, 
                       raw_data);
}

module.exports = {
    check_data: function(url) {
        
        var raw_data, data;
        var queries = [];
        
        raw_data = Baby.parseFiles( url, {header: true} );
        data = rf.filter_data_quality(raw_data.data);
        
        if (data.length>1){
            // Run the rest of the data checks here
            data.forEach( function(pt) {
                var row_ind = get_row(pt, raw_data.data);
                if (pt.cssrs_01=='1' || pt.cssrs_02=='1'){
                    fields = ['06', '07', '08', '09', '10', '11', '12'];
                    for (var j=0; j<fields.length; j++){
                        if (pt['cssrs_'+fields[j]]==''){
                           queries.push(rf.make_query(pt, 'cssrs_'+fields[j], "Should not be blank given lifetime ideation", row_ind));
                        }
                    }
                    
                    if (pt.cssrs_02=='1'){
                        fields = ['03', '04', '05'];
                        for (var j=0; j<fields.length; j++){
                            if (pt['cssrs_'+fields[j]]==''){
                               queries.push(rf.make_query(pt, 'cssrs_'+fields[j], "Should not be blank given item 2 is Yes (1)", row_ind));
                            }
                        }
                    }
                } else if (pt.cssrs_02=='0'){
                    fields = ['03', '04', '05'];
                    for (var j=0; j<fields.length; j++){
                        if (pt['cssrs_'+fields[j]]!=''){
                           queries.push(rf.make_query(pt, 'cssrs_'+fields[j], "Should be blank given item 2 is No (0)", row_ind));
                        }
                    }
                }
                
                if (pt.cssrs_13=='1'){
                    fields = ['24','25','27','28','30','31'];
                    for (var j=0; j<fields.length; j++){
                            if (pt['cssrs_'+fields[j]]==''){
                               queries.push(rf.make_query(pt, 'cssrs_'+fields[j], "Should not be blank given item 13 is Yes (1)", row_ind));
                            }
                    }
                } else if (pt.cssrs_13=='0'){
                    fields = ['24','25','27','28','30','31'];
                    for (var j=0; j<fields.length; j++){
                            if (pt['cssrs_'+fields[j]]!=''){
                               queries.push(rf.make_query(pt, 'cssrs_'+fields[j], "Should be blank given item 13 is No (0)", row_ind));
                            }
                    }
                }
            });
        }
        
        return queries;        
    }
}
