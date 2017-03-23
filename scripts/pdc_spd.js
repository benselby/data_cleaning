var Baby = require("babyparse");
var util = require('util');
var fs = require('fs');
var rf = require('./reports');

function get_row( row, raw_data ){
    return rf.get_row({"SiteNumber":row.SiteNumber,
                       "SubjectNumber":row.SubjectNumber,
                       "VisitLabel":row.VisitLabel}, 
                       raw_data);
}

module.exports = {
    check_data: function(spd_url, pdc_url) {
                
        var queries = [];
        
        var raw_spd = Baby.parseFiles( spd_url, {header: true} ).data;
        var spd_data = rf.filter_data_quality(raw_spd);
        
        var raw_pdc = Baby.parseFiles( pdc_url, {header: true} ).data;
        var pdc_data = rf.filter_data_quality(raw_pdc);
        
        if (pdc_data.length>1){
            // Run the rest of the data checks here
            pdc_data.forEach( function( pdc_row ) { 
                var pdc_ind = get_row( pdc_row, raw_pdc ) - 2; 
                var spd_ind = get_row( pdc_row, raw_spd ) - 2; 
                
                if (spd_ind== -1){
                    return;
                }                
                var spd_row = raw_spd[spd_ind];
                
                // Check if pt has met SPD criteria in the past:
                var met_spdc = false;
                var timepoint = ''
                var past_rows = spd_data.filter( function(pt) { 
                    return pt.SiteNumber==pdc_row.SiteNumber && pt.SubjectNumber==pdc_row.SubjectNumber && pt.VisitNumber<=pdc_row.VisitNumber;
                    });
                    
                past_rows.forEach( function(visit){
                    if (visit.SPDC_10=='1'){
                        met_spdc = true;
                        timepoint = visit.VisitLabel;
                    }
                });
                                            
                if (pdc_row.pdc_c1=='1'){                  
                    
                    if (met_spdc==false){
                        var str = "Should be 'No' given participant has not met SPD criteria at or before this timepoint";
                        queries.push(rf.make_query(pdc_row, 'PDC GRD - C1', str, pdc_ind+2));
                    }                                          
                } else if (pdc_row.pdc_c1=='0'){           
                    if (met_spdc){
                        var str = "Should be 'Yes' given participant met SPD criteria at timepoint " + timepoint;
                        queries.push(rf.make_query(pdc_row, 'PDC GRD - C1', str, pdc_ind+2));
                    }
                }
            }); 
        }        
        return queries;        
    }
}
