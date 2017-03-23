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
    check_data: function(sops_url, pdc_url) {
        
        var queries = [];
        
        var raw_sops = Baby.parseFiles( sops_url, {header: true} ).data;
        var sops_data = rf.filter_data_quality(raw_sops);
        
        var raw_pdc = Baby.parseFiles( pdc_url, {header: true} ).data;
        var pdc_data = rf.filter_data_quality(raw_pdc);
        
        if (pdc_data.length>1){
            // Run the rest of the data checks here
            pdc_data.forEach( function( pdc_row ) {
                var pdc_ind = get_row( pdc_row, raw_pdc ) - 2; 
                var sops_ind = get_row( pdc_row, raw_sops ) - 2; 
                
                if (sops_ind== -1){
                    return;
                }
                
                var sops_row = raw_sops[sops_ind];
                
                var sops_p = ['P1_SOPS','P2_SOPS','P3_SOPS','P4_SOPS','P5_SOPS'];
                if (pdc_row.pdc_a1=='1'){
                    var found_6 = false;
                    for (i in sops_p){
                        if (sops_row[sops_p[i]]=='6'){
                            found_6 = true;
                            break;
                        }
                    }
                    if (found_6==false){
                        var str = "Should be 'No' given no SOPS P1-5 score of 6";
                        queries.push(rf.make_query(pdc_row, 'PDC BIPS - A1', str, pdc_ind+2));
                    }
                } else if (pdc_row.pdc_a1=='0'){
                    sops_p.forEach(function(item){
                        if (sops_row.item=='6'){
                            var str = "Should be 'Yes' given " + item + "  score of 6";
                            queries.push(rf.make_query(pdc_row, 'PDC BIPS - A1', str, pdc_ind+2));
                        }
                    });
                }
                
                if (pdc_row.pdc_b1=='1'){
                    var found = false;
                    for (i in sops_p){
                        if (sops_row[sops_p[i]]>='3'&&sops_row[sops_p[i]]<='5'){
                            found = true;
                            break;
                        }
                    }
                    if (found==false){
                        var str = "Should be 'No' given no SOPS P1-5 score of 3-5";
                        queries.push(rf.make_query(pdc_row, 'PDC APS - B1', str, pdc_ind+2));
                    }
                } else if (pdc_row.pdc_b1=='0'){
                    sops_p.forEach(function(item){
                        if (sops_row.item>='3'&&sops_row.item<='5'){
                            var str = "Should be 'Yes' given " + item + "  score of " + sops_row.item;
                            queries.push(rf.make_query(pdc_row, 'PDC APS - B1', str, pdc_ind+2));
                        }
                    });
                }
                
                
            }); 
        }        
        return queries;        
    }
}
