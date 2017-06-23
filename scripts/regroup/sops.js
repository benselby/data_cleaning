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

function check_baseline(measures, data, raw, queries){
    measures.forEach( function(measure) {
        var sops = measure + "_SOPS";
        var odc = measure + "_OnsetDateCode";
        var onset = measure + "_Onset";
        
        data.forEach( function(pt){
            var row_ind = get_row(pt, raw.data);
            if (parseInt(pt[sops]) < 3 ){
                if (pt[odc] != '1') {
                    queries.push( rf.make_query(pt, measure + ' onset date code', "Should be 1 given severity < 3", row_ind) );
                }
                if (pt[onset] != ""){
                    queries.push( rf.make_query(pt, measure + ' onset date', "Should be NA given severity < 3", row_ind) );
                }
            } else if (parseInt(pt[sops]) > 2 ){
                if ( pt[odc] == '1') {                       
                    queries.push( rf.make_query(pt, measure + ' onset date code', "Should not be 1 given severity > 2", row_ind) );
                } else if (pt[odc] == '2' && pt[onset] == ""){
                    queries.push( rf.make_query(pt, measure + ' onset date', "Should not be blank given onset date code of 2", row_ind) );
                }
            }
        });
    });
}

/*
 * Returns an array of row indices in the raw data object
 */
function filter_rows(array, test, raw) {
    var passed = [];
    for (var i=0; i<array.length; i++){
        if (test(array[i]))
            passed.push(get_row( array[i], raw.data ) );
        }
    return passed;    
}

/***** DEPRECATED
function check_conversion(measure, data, raw, queries) {
    var bad = filter_rows(data, function(pt){
        var row_ind = get_row(pt, raw.data);
        if (pt[measure+"_SOPS"]=='6' && pt.VisitLabel!='C'){
            queries.push( rf.make_query(pt, measure+"_SOPS / VisitLabel", "Participant should be conversion with SOPS score of 6", row_ind) );
            return true;
        } else 
            return false;
    }, raw);
}*/

function check_onset(measures, data, raw, queries) {
    measures.forEach( function(measure) {
        data.forEach( function(pt){
            var row_ind = get_row(pt, raw.data);
            if (pt[measure+"_OnsetDateCode"]=='3' && pt[measure+"_Onset"]!=''){
                queries.push( rf.make_query(pt, measure + ' onset date', "Should be N/A given onset code of 3 (Lifetime)", row_ind) );
            }
        });
    });
}

function check_enhanced(data, raw, queries) {
    var other = ["N1","N2","N3","N4","N5","N6","G1","G2","G3","G4","D1","D2","D3","D4"];
    for (var i=0; i<data.length; i++) {
        var row_ind = rf.get_row( data[i], raw.data );
        for (m in other) {
            measure = other[m] + "_SOPS";
            if (data[i][m] == ""){
                queries.push( rf.make_query(data[i], measure, "Should not be blank since participant is enhanced", row_ind) );
                break;
            }
        }
    }
}

function check_followup(measures, data, raw, queries) {
    var bad_dates = [];
    var done = [];
    // first, filter by participant:
    for (var i=0; i<data.length; i++) {
        var full_id = data[i]["SiteNumber"] + '_' + data[i]["SubjectNumber"]
        if (done.indexOf(full_id) == -1 ) {
            done.push(full_id);
            var site = data[i].SiteNumber;
            var subj = data[i].SubjectNumber;
            var pt_data = data.filter( function(p) { return p["SiteNumber"] == site && p["SubjectNumber"]== subj} );

            if (pt_data.length>1){
                // first, sort the data by date
                function compare_date(a,b){
                    var date_a = new Date(a.DataCollectedDate.replace(/-/g," "));
                    var date_b = new Date(b.DataCollectedDate.replace(/-/g," "));
                    
                    if (date_a.getTime() > date_b.getTime())
                        return 1;
                    if (date_a.getTime() < date_b.getTime())
                        return -1;
                    return 0;
                }
                pt_data.sort(compare_date);
                
                // Check that each date and assesment has a logical flow:
                visit_labels = ['BL', 'ET', '12'];
                
                var inds = pt_data.map( function(row) {
                    var ind = visit_labels.indexOf(row.VisitLabel);
                    if (ind==-1)
                        return;
                    else
                        return ind;
                });
                
                var bad_date = false;
                
                for (var j=1; j<inds.length; j++){
                    if (inds[j] < inds[j-1]){
                        bad_date = true;
                        queries.push( rf.make_query(pt_data[j], "DataCollectedDate", "Illogical dates for visit labels - please check all dates for participant", rf.get_row( pt_data[0], raw.data )) );
                        bad_dates.push(full_id);
                        break;
                    }                            
                }
                
                if (!bad_date){
                    measures.forEach( function(measure) {
                        for (var j=1; j<pt_data.length; j++) {
                            var row_ind = rf.get_row( pt_data[j], raw.data );
                            
                            if (pt_data[j][measure+'_SOPS'] > 2) {                        
                                var earlier_onset = false;
                                var visit_label = '';
                                for (var k=0; k<j; k++){
                                    if (pt_data[k][measure+'_SOPS']>2){
                                        earlier_onset=true;
                                        visit_label = pt_data[k].VisitLabel;
                                        break;
                                    }
                                }   
                            
                                if (earlier_onset){
                                    if (pt_data[j][measure+'_OnsetDateCode'] != 1 ) {
                                        str = util.format("Should be 1 (N/A) given earlier recorded onset at %s", visit_label);
                                        queries.push( rf.make_query(pt_data[j], measure + ' onset date code', str, row_ind) );
                                    }                            
                                    
                                    if ( pt_data[j][measure+'_Onset'] != '' ){
                                        str = util.format("Should be N/A given earlier recorded onset at %s", visit_label);
                                        queries.push( rf.make_query(pt_data[j], measure + ' onset date', str, row_ind) );
                                    }
                                    
                                    if (pt_data[j][measure+"_SOPS"] <= pt_data[j-1][measure+"_SOPS"] && pt_data[j][measure+"_DateOfIncrease"] != ''){
                                           queries.push( rf.make_query(pt_data[j], measure + ' date of increase', "Should be N/A given severity did not increase", row_ind) );  
                                    }
                                    else if (pt_data[j][measure+"_SOPS"] > pt_data[j-1][measure+"_SOPS"] && pt_data[j][measure+"_DateOfIncrease"] == ''){
                                           queries.push( rf.make_query(pt_data[j], measure + ' date of increase', "Should not be N/A given severity increased from " + pt_data[j-1].VisitLabel, row_ind) );  
                                    }
                                    
                                } else {
                                    if (pt_data[j][measure+'_OnsetDateCode'] == 1 ) { 
                                        queries.push( rf.make_query(pt_data[j], measure + ' onset date code', "Should not be 1 (N/A) given severity > 2", row_ind) );
                                    } 
                                    
        //                            if (pt_data[j][measure+'_DateOfIncrease']!=''){
        //                                queries.push( rf.make_query(pt_data[j], measure + ' date of increase', "Should be N/A given no prior onset recorded", row_ind) );  
        //                            }
                                    
                                    if (pt_data[j][measure+'_OnsetDate'] == '' ) {  
                                        queries.push( rf.make_query(pt_data[j], measure + ' onset date', "Should not be N/A given severity > 2", row_ind) );  
                                    }                    
                                }
                                
                            } else {
                            
                                if (pt_data[j][measure+"_DateOfIncrease"]!=''){
                                    queries.push( rf.make_query(pt_data[j], measure + ' date of increase', "Should be N/A given severity < 3", row_ind) );
                                }
                                
                                if (pt_data[j][measure+'_Onset'] != ''){
                                    queries.push( rf.make_query(pt_data[j], measure + ' onset date', "Should be N/A given severity < 3", row_ind) );
                                }
                            }
                                       
                        }
                        
                        // Check that onset dates are before visit dates, and increase dates are after onset dates
                        pt_data.forEach( function(row){
                            var idx = rf.get_row( row, raw.data );
                            if (row[measure+'_Onset'] != ''){
                                var onset_date = new Date(row[measure+'_Onset'].replace(/-/g," "));
                                var visit_date = new Date(row['DataCollectedDate'].replace(/-/g," "));                                               
                                var onset_diff = Math.abs(visit_date.getTime() - onset_date.getTime());                       
                                
                                if (onset_diff < 0)                     
                                    queries.push( rf.make_query(row, measure + ' onset date', "Cannot be earlier than data collection date", idx) );
                                    
                                if (row[measure+'_DateOfIncrease']!=''){
                                    var increase_date = new Date(row[measure+'_DateOfIncrease'].replace(/-/g," "));                                               
                                    var increase_diff = Math.abs(increase_date.getTime() - onset_date.getTime());
                                    if (increase_diff < 0)
                                        queries.push( rf.make_query(row, measure + ' increase date', "Cannot be earlier than onset date", idx) );
                                }
                            }
                        });
                    });
                }
            }
        }
    }
}

module.exports = {
    check_data: function(url) {
        
        rf.init_report( "SOPS", './reports/SOPS.txt', url );
        
        var raw_data, data;
        var queries = [];
        
        raw_data = Baby.parseFiles( url, {header: true} );
            
        data = rf.filter_data_quality(raw_data.data);
        
        if (data.length>1){
            var baseline = rf.filter(data, function(pt){
                return pt.VisitLabel=="BL"
            });
            
            var measures = ["P1","P2","P3","P4","P5"];
            check_baseline(measures, baseline, raw_data, queries);
            check_onset(measures, data, raw_data, queries);
//                check_conversion(measures[m], data, raw_data, queries); No longer need this - cross-check with PDC only
            check_followup(measures, data, raw_data, queries);
        }
        
        var enhanced = rf.filter(data, function(pt) {
            return pt.SubjectType=="Enhanced";
        });
        
        check_enhanced(enhanced, raw_data, queries);
        
        var nonenhanced = rf.filter(data, function(pt) {
            return pt.SubjectType=="Non-Enhanced";
        });
        
        var prefixes = ["N1","N2","N3","N4","N5","N6","G1","G2","G3","G4","D1","D2","D3","D4"];
        for (var i=0; i<nonenhanced.length; i++){
            var row_ind = rf.get_row( nonenhanced[i], raw_data.data );
            for (m in prefixes) {
                measure = prefixes[m] + "_SOPS";
                if (nonenhanced[i][measure] != "" && nonenhanced[i].VisitLabel!='BL' && nonenhanced[i].VisitLabel!='C'){
                    queries.push( rf.make_query(nonenhanced[i], prefixes[m], "Items N1-G4 should be blank since participant is non-enhanced", row_ind) );
                    break;
                }
            }   
        }
        
        return queries;
    }
}
