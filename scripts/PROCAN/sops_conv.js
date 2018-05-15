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
    check_data: function(sops_url, conv_url) {
        
        var raw_sops, scid_sops, raw_conv, conv_data;
        var queries = [];
        
        raw_sops = Baby.parseFiles( sops_url, {header: true} ).data;
        sops_data = rf.filter_data_quality(raw_sops);
        
        raw_conv = Baby.parseFiles( conv_url, {header: true} ).data;
        conv_data = rf.filter_data_quality(raw_conv);
        
        if (conv_data.length>1){
            // Run the rest of the data checks here
            conv_data.forEach( function( conv_row ) {
                var conv_ind = get_row( conv_row, raw_conv ) - 2; 
                var conv_date = new Date( conv_row.date_of_conversion.replace(/-/g," "));
                
                var sops_rows = sops_data.filter( function(row) {
                    return row.SiteNumber==conv_row.SiteNumber && row.SubjectNumber==conv_row.SubjectNumber;
                });
                
                sops_rows.forEach( function (sops_row){
                    var sops_date = new Date( sops_row.DataCollectedDate.replace(/-/g," "));
                    
                    var diff = sops_date.getTime() - conv_date.getTime();
                    if (sops_row.VisitLabel!='C'){
                        if (diff > 0){
                            queries.push(rf.make_query(sops_row, 'Date of conversion', "Non-conversion SOPS assessment recorded after conversion date",get_row( sops_row, raw_sops )));
                        }
                        
                        if (sops_row.VisitLabel=='BL') {
                            var diffDays = Math.ceil(Math.abs(diff) / (1000*3600*24) ); 
                            if (Math.abs(diffDays - conv_row.days_from_baseline)>1){
                                var desc = "Incorrect given SOPS baseline date and Conversion date - should be " + diffDays;
                                queries.push(rf.make_query(conv_row, 'Conversion - days from baseline', desc, conv_ind+2));
                                
                            }
                        }
                    } 
                });
            }); 
        }        
        return queries;        
    }
}
