var Baby = require("babyparse");
var util = require('util');
var fs = require('fs');
var rf = require('./reports');

function check_baseline(measure, data, raw){
    var sops = measure + "_SOPS";
    var odc = measure + "_OnsetDateCode";
    var onset = measure + "_Onset";
    
    var bad_severity = filter_rows(data, function(pt){
        if (parseInt(pt[sops]) < 3 && (pt[odc] != '1' || pt[onset] != "") )
            return true;
        else if (parseInt(pt[sops]) > 2 ){
            if ( pt[odc] == '1')                        
                return true;
            else if (pt[odc] == '2' && pt[onset] == "")
                return true;
            else 
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
            passed.push(rf.get_row( {"SiteNumber": array[i].SiteNumber, 
                                      "SubjectNumber": array[i].SubjectNumber, 
                                      "VisitNumber": array[i].VisitNumber}, 
                                      raw.data ) );
        }
    return passed;    
}

function check_conversion(measure, data, raw) {
    var bad = filter_rows(data, function(pt){
        return pt[measure+"_SOPS"]=='6' && pt.VisitLabel!='C';
    }, raw);
    if (bad.length>0)
        rf.write_report(util.format("%s_SOPS scores do not correspond with conversion for rows %s", measure, bad.toString()));
    else
        rf.write_report(util.format("All %s SOPS scores of 6 correspond with conversion.", measure));
}

function check_onset(measure, data, raw) {
    var bad = filter_rows(data, function(pt){
        return pt[measure+"_OnsetDateCode"]=='3' && pt[measure+"_Onset"]!='';
    }, raw);
    if (bad.length>0)
        rf.write_report(util.format("Onset date specifed for %s lifetime symptom for rows %s", measure, bad.toString()));
    else
        rf.write_report(util.format("All %s lifetime symptoms have no dates specified.", measure));
}

function check_enhanced(data, raw) {
    var bad = [];
    var other = ["N1","N2","N3","N4","N5","N6","G1","G2","G3","G4","D1","D2","D3","D4"];
    for (var i=0; i<data.length; i++) {
        for (m in other) {
            if (data[i][m] == ""){
                bad.push(rf.get_row( {"SiteNumber": array[i].SiteNumber, 
                                      "SubjectNumber": array[i].SubjectNumber, 
                                      "VisitNumber": array[i].VisitNumber}, 
                                      raw.data ) );
                break;
            }
        }
    }
    if (bad.length>0)
        rf.write_report(util.format("Missing enhanced N1-G4 data for rows %s", bad.toString()));
    else
        rf.write_report(util.format("All enhanced data for N1-G4 present."));
}

function check_followup(measure, data, raw) {
    var visit_labels; 
    var done = [];
    var bad = [];
    // first, filter by participant:
    for (var i=0; i<data.length; i++) {
        var id = data[i]["SiteNumber"] + data[i]["SubjectNumber"]
        if (done.indexOf(id) == -1) {
            var pt_data = data.filter( function(row) { return row["SiteNumber"] == data[i]["SiteNumber"] && row["SubjectNumber"]== data[i]["SubjectNumber"]} );
            
            if (pt_data.length>2){
                for (var j=2; j<pt_data.length; j++) {
                    // ARE THE DATA ALWAYS SORTED BY VISIT NUMBER?
                    if (pt_data[j][measure+"_SOPS"] > 2 && pt_data[j-1][measure+"_SOPS"] > 2) {
                        if (pt_data[j].OnsetDateCode != 1 || pt_data[j].Onset != '' ) {
                            bad.push(rf.get_row( {"SiteNumber": pt_data[j].SiteNumber, 
                                                  "SubjectNumber": pt_data[j].SubjectNumber, 
                                                  "VisitNumber": pt_data[j].VisitNumber}, 
                                                  raw.data ) ); 
                        } else if (pt_data[j][measure+"_SOPS"] > pt_data[j-1][measure+"_SOPS"] && pt_data[j][measure+"_DateOfIncrease"] != ''){
                            bad.push(rf.get_row( {"SiteNumber": pt_data[j].SiteNumber, 
                                                  "SubjectNumber": pt_data[j].SubjectNumber, 
                                                  "VisitNumber": pt_data[j].VisitNumber}, 
                                                  raw.data ) );
                        }
                    } else if (pt_data[j][measure+"_SOPS"] > 2 && pt_data[j-1][measure+"_SOPS"] < 3) {                       
                        if (pt_data[j].OnsetDateCode == 1 || (pt_data[j].OnsetDateCode==2 && pt_data[j].Onset=='')){
                            bad.push(rf.get_row( {"SiteNumber": pt_data[j].SiteNumber, 
                                                  "SubjectNumber": pt_data[j].SubjectNumber, 
                                                  "VisitNumber": pt_data[j].VisitNumber}, 
                                                  raw.data ) ); }
                    }             
                }
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
        
        rf.init_report("SOPS", './reports/SOPS.txt', url);
        
        var raw_data, data;
        
        raw_data = Baby.parseFiles( url, {header: true} );
        if (raw_data.errors) {
            console.log("Parsed file %s and found the following error:", url);
            console.log( "\"", raw_data.errors[0].message, "\"" );
        } else
            console.log( "Parsed file %s and found no errors.", url );  
            
        data = rf.filter_data_quality(raw_data.data);
        
        if (data.length>1){
            var baseline = rf.filter(data, function(pt){
                return pt.VisitNumber=="1"
            });
            
            var measures = ["P1","P2","P3","P4","P5"];
            for (m in measures){
                check_baseline(measures[m], baseline, raw_data);
                check_onset(measures[m], data, raw_data);
                check_conversion(measures[m], data, raw_data);
                check_followup(measures[m], data, raw_data);
            }
        }
        
        var enhanced = rf.filter(data, function(pt) {
            return pt.SubjectType=="Enhanced";
        });
        
        check_enhanced(enhanced, raw_data);
        
        var nonenhanced = rf.filter(data, function(pt) {
            return pt.SubjectType=="Non-Enhanced";
        });
    }
}
