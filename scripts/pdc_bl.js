var Baby = require("babyparse");
var util = require('util');
var fs = require('fs');
var rf = require('./reports');

module.exports = {
    check_data: function(url) {
        
        rf.init_report("PDC_BL", './reports/PDC_BL.txt', url);
        
        var raw_data, data;
        
        raw_data = Baby.parseFiles( url, {header: true} );
        if (raw_data.errors) {
            console.log("Parsed file %s and found the following error:", url);
            console.log( "\"", raw_data.errors[0].message, "\"" );
        } else
            console.log( "Parsed file %s and found no errors.", url );  
        
        data = rf.filter_data_quality(raw_data.data);
            
        if (data.length > 1) {
            var bad_aps = [];
            var bad_grd = [];
            var bad_bips = [];
            
            for (var i=0; i<data.length; i++) {
                // BIPS checks
                if (data[i].pdc_a1=='1'){
                    var targets = ['pdc_a2', 'pdc_a3','pdc_a4','pdc_a5','pdc_a6','pdc_a8'];
                    for (j in targets){
                        if (data[i][targets[j]] != ''){
                            bad_bips.push(rf.get_row({"SiteNumber":data[i].SiteNumber,
                                      "SubjectNumber":data[i].SubjectNumber,
                                      "VisitLabel":data[i].VisitLabel}, 
                                      raw_data.data));
                            break;
                        }
                    }
                    
                }
                else if (data[i].pdc_a1=='0') {
                    var targets = ['pdc_a2', 'pdc_a3','pdc_a4','pdc_a5','pdc_a6','pdc_a8'];
                    
                    if (data[i]['pdc_a7']=='1')
                        bad_bips.push(rf.get_row({"SiteNumber":data[i].SiteNumber,
                                          "SubjectNumber":data[i].SubjectNumber,
                                          "VisitLabel":data[i].VisitLabel}, 
                                          raw_data.data));
                    else{
                        for (j in targets){
                            if (data[i][targets[j]] == '1' || data[i][targets[j]] == '2'){
                                bad_bips.push(rf.get_row({"SiteNumber":data[i].SiteNumber,
                                          "SubjectNumber":data[i].SubjectNumber,
                                          "VisitLabel":data[i].VisitLabel}, 
                                          raw_data.data));
                                break;
                            }
                        }
                    }
                    
                }
                var targets = ['pdc_a2', 'pdc_a3','pdc_a4'];
                var not_c = [];
                for (j in targets){
                    if (data[i][targets[j]] == '0' && data[i].VisitLabel!='C'){
                        not_c.push(rf.get_row({"SiteNumber":data[i].SiteNumber,
                                              "SubjectNumber":data[i].SubjectNumber,
                                              "VisitLabel":data[i].VisitLabel}, 
                                              raw_data.data));
                    }
                }
                
                if (data[i]['pdc_a7']=='1'){
                    var targets = ['pdc_a1', 'pdc_a2','pdc_a3','pdc_a4','pdc_a5','pdc_a6'];
                    for (j in targets){
                        if (data[i][targets[j]] == '0' || data[i][targets[j]] == ''){
                            not_c.push(rf.get_row({"SiteNumber":data[i].SiteNumber,
                                                  "SubjectNumber":data[i].SubjectNumber,
                                                  "VisitLabel":data[i].VisitLabel}, 
                                                  raw_data.data));
                        }
                    }
                }
                    
                // APS checks
                
                // GRD checks
            }
            
            if (bad_bips.length>1)
                rf.write_report(util.format('Bad BIPS entries for the following rows: %s', bad_bips.toString()));
            else 
                rf.write_report("All BIPS entries look good.");
            
        }
        
    }
}
