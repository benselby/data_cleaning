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

function check_baseline(measure, data, raw, queries){
    var sops = measure + "_SOPS";
    var odc = measure + "_OnsetDateCode";
    var onset = measure + "_Onset";
    
    var bad_severity = filter_rows(data, function(pt){
        var row_ind = get_row(pt, raw.data);
        if (parseInt(pt[sops]) < 3 ){
            if (pt[odc] != '1') {
                queries.push( rf.make_query(pt, measure + ' onset date code', "Should be 1 given severity < 3", row_ind) );
                return true;
            }
            if (pt[onset] != ""){
                queries.push( rf.make_query(pt, measure + ' onset date', "Should be NA given severity < 3", row_ind) );
                return true;
            }
        } else if (parseInt(pt[sops]) > 2 ){
            if ( pt[odc] == '1') {                       
                queries.push( rf.make_query(pt, measure + ' onset date code', "Should not be 1 given severity > 2", row_ind) );
                return true;
            } else if (pt[odc] == '2' && pt[onset] == ""){
                queries.push( rf.make_query(pt, measure + ' onset date', "Should not be blank given onset date code of 2", row_ind) );
                return true;
            } else 
                return false; 
        }
        return false;
    }, raw);
    
    if (bad_severity.length>0){
        rf.write_report(util.format("Bad %s/%s/%s for rows %s", sops, odc, onset, bad_severity.toString() ));
    }
    else
        rf.write_report(util.format("All %s/%s/%s look good.", sops, odc, onset));
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

function check_conversion(measure, data, raw, queries) {
    var bad = filter_rows(data, function(pt){
        var row_ind = get_row(pt, raw.data);
        if (pt[measure+"_SOPS"]=='6' && pt.VisitLabel!='C'){
            queries.push( rf.make_query(pt, measure+"_SOPS / VisitLabel", "Participant should be conversion with SOPS score of 6", row_ind) );
            return true;
        } else 
            return false;
    }, raw);
    if (bad.length>0)
        rf.write_report(util.format("%s_SOPS scores do not correspond with conversion for rows %s", measure, bad.toString()));
    else
        rf.write_report(util.format("All %s SOPS scores of 6 correspond with conversion.", measure));
}

function check_onset(measure, data, raw, queries) {
    var bad = filter_rows(data, function(pt){
        var row_ind = get_row(pt, raw.data);
        if (pt[measure+"_OnsetDateCode"]=='3' && pt[measure+"_Onset"]!=''){
            queries.push( rf.make_query(pt, measure + ' onset date', "Should be N/A given onset code of 3 (Lifetime)", row_ind) );
            return true;
        } else
            return false;
    }, raw);

}

function check_enhanced(data, raw, queries) {
    var bad = [];    
    var other = ["N1","N2","N3","N4","N5","N6","G1","G2","G3","G4","D1","D2","D3","D4"];
    for (var i=0; i<data.length; i++) {
        var row_ind = rf.get_row( data[i], raw.data );
        for (m in other) {
            measure = other[m] + "_SOPS";
            if (data[i][m] == ""){
                bad.push(row_ind);
                queries.push( rf.make_query(data[i], measure, "Should not be blank since participant is enhanced", row_ind) );
                break;
            }
        }
    }
    if (bad.length>0)
        rf.write_report(util.format("Missing enhanced N1-G4 data for rows %s", bad.toString()));
    else
        rf.write_report(util.format("All enhanced data for N1-G4 present."));
}

function check_followup(measure, data, raw, queries) {
    var done = [];
    var bad = [];
    // first, filter by participant:
    for (var i=0; i<data.length; i++) {
        var id = data[i]["SiteNumber"] + '_' + data[i]["SubjectNumber"]
        if (done.indexOf(id) == -1) {
            var site = data[i].SiteNumber;
            var subj = data[i].SubjectNumber;
            var pt_data = data.filter( function(p) { return p["SiteNumber"] == site && p["SubjectNumber"]== subj} );

            if (pt_data.length>1){
                for (var j=1; j<pt_data.length; j++) {
                    var row_ind = rf.get_row( pt_data[j], raw.data );
                    // ARE THE DATA ALWAYS SORTED BY VISIT NUMBER? - seems like yes - this script depends on it.
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
                            else if (pt_data[j][measure+"_SOPS"] <= pt_data[j-1][measure+"_SOPS"] && pt_data[j][measure+"_DateOfIncrease"] != ''){
                                   queries.push( rf.make_query(pt_data[j], measure + ' date of increase', "Should be N/A given severity did not increase", row_ind) );  
                            }
                            else if (pt_data[j][measure+"_SOPS"] > pt_data[j-1][measure+"_SOPS"] && pt_data[j][measure+"_DateOfIncrease"] == ''){
                                   queries.push( rf.make_query(pt_data[j], measure + ' date of increase', "Should not be N/A given severity increased", row_ind) );  
                            }
                            
                        } else {
                            if (pt_data[j][measure+'_OnsetDateCode'] == 1 ) { 
                                queries.push( rf.make_query(pt_data[j], measure + ' onset date code', "Should not be 1 (N/A) given severity > 2", row_ind) );
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
            }
            done.push(id);
        }
    }

    if (bad.length>0)
        rf.write_report(util.format("Illogical %s follow-up data for rows %s", measure, bad.toString()));
    else
        rf.write_report(util.format("All %s follow-up data looks good.", measure));
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
                return pt.VisitNumber=="1"
            });
            
            var measures = ["P1","P2","P3","P4","P5"];
            for (m in measures){
                check_baseline(measures[m], baseline, raw_data, queries);
                check_onset(measures[m], data, raw_data, queries);
                check_conversion(measures[m], data, raw_data, queries);
                check_followup(measures[m], data, raw_data, queries);
            }
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
                if (nonenhanced[i][measure] != "" && nonenhanced[i].VisitLabel!='BL'){
                    queries.push( rf.make_query(nonenhanced[i], prefixes[m], "Items N1-G4 should be blank since participant is non-enhanced", row_ind) );
                    break;
                }
            }   
        }
        
        return queries;
    }
}
