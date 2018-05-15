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
    check_data: function(sops_url, pdc_url) {
        var queries = [];
        
        var raw_sops = Baby.parseFiles( sops_url, {header: true} ).data;
        var sops_data = rf.filter_data_quality(raw_sops);
        
        var raw_pdc = Baby.parseFiles( pdc_url, {header: true} ).data;
//        var pdc_data = rf.filter_data_quality(raw_pdc);
        var raw_pbl = Baby.parseFiles( './PROCAN/PCAN_PDC_BL.csv', {header: true} ).data;
//        var pbl_data = rf.filter_data_quality(raw_pbl);
        
        var pdc_list = [];
        pdc_list.push( raw_pdc );
        pdc_list.push( raw_pbl );        
        
        for (var d=0; d<pdc_list.length; d++){
            var pdc_data = rf.filter_data_quality(pdc_list[d]);
            if (pdc_data.length>1){
                // Run the rest of the data checks here
                pdc_data.forEach( function( pdc_row ) {
                    var pdc_ind = get_row( pdc_row, pdc_list[d] ) - 2; 
                    var sops_ind = get_row( pdc_row, raw_sops ) - 2; 
                    
                    if (sops_ind == -3){
			err = pdc_row.SiteNumber + '_' + pdc_row.SubjectNumber + '_' + pdc_row.VisitLabel;
			console.log("SOPS-PDC: no matching SOPS row for PDC entry", err);
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
        }
        return queries;        
    }
}
