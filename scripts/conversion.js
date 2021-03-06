var Baby = require("babyparse");
var util = require('util');
var fs = require('fs');
var rf = require('./reports');

function findAtLeastOne(array, props, raw_data, queries) {
    var contains_none = [];
    var found;
    for (var i=0; i<array.length; i++){
        var row_ind = rf.get_data_row( array[i].SiteNumber, array[i].SubjectNumber, raw_data.data );
        found = false;
        for (var j=0; j<props.length; j++){
            if (array[i][props[j]]==6){
                found = true;   
                break;
            }
        }
        if (found==false){
            queries.push( rf.make_query(array[i], props[0], "No SOPS score of 6 found", row_ind) );
            contains_none.push( row_ind );
        }
    }  
    if (contains_none.length==0)
        rf.write_report("All rows contain at least one SOPS score of 6.");
    else
        rf.write_report( util.format( "No SOPS score of 6 found for %d rows: %s", contains_none.length, contains_none.toString() ));
    return contains_none;
};

module.exports = {
    check_data: function(url) {
        
        rf.init_report("Conversion", './reports/Conversion.txt', url);
        
        var raw_data, data;
        var queries = [];
        
        raw_data = Baby.parseFiles( url, {header: true} );
//        log_results();
        process_data();
        
        function log_results() {
            if (raw_data.errors) {
                console.log("Parsed file %s and found the following error:", url);
                console.log( "\"", raw_data.errors[0].message, "\"" );
            } else
                console.log( "Parsed file %s and found no errors.", url );  
        }
        
              
        //Filter data based on data quality:
        function process_data() {

            data = rf.filter_data_quality(raw_data.data);
                
            if (data.length > 1) {
                // Run the tests for the conversion file: 
                rf.findBlankRows(data, "P1_SOPS", raw_data, queries);
                rf.findBlankRows(data, "P2_SOPS", raw_data, queries);
                rf.findBlankRows(data, "P3_SOPS", raw_data, queries);
                rf.findBlankRows(data, "P4_SOPS", raw_data, queries);
                rf.findBlankRows(data, "P5_SOPS", raw_data, queries);
                rf.findZeroRows(data, "pops_criterion_one", raw_data, queries);
                rf.findZeroRows(data, "pops_criterion_two", raw_data, queries);
                rf.findZeroRows(data, "pops_criteria_met", raw_data, queries);
                rf.findBlankRows(data, "date_of_conversion", raw_data, queries);
                rf.findBlankRows(data, "diagnosis_determination", raw_data, queries);
                findAtLeastOne(data, ["P1_SOPS","P2_SOPS","P3_SOPS","P4_SOPS","P5_SOPS"], raw_data, queries);
                
                var bad_diffs = [];
                for (var i=0; i<data.length; i++){
                    var row_ind = rf.get_row( {'SiteNumber':data[i].SiteNumber,      'SubjectNumber':data[i].SubjectNumber}, raw_data.data );
                    var conv_date = new Date(data[i].date_of_conversion.replace(/-/g," "));
                    var coll_date = new Date(data[i].DataCollectedDate.replace(/-/g, " "));
                    var timeDiff = Math.abs(coll_date.getTime() - conv_date.getTime());
                    var diffDays = Math.ceil(timeDiff / (1000*3600*24) ); 
                    if (diffDays!=data[i].days_since_conversion){
                        bad_diffs.push(row_ind); 
                        queries.push( rf.make_query(data[i], "days_since_conversion", "Incorrect based on date_of_conversion and DataCollectedDate - should be " + diffDays, row_ind) );
                    }
                }
                if (bad_diffs.length!=0)
                    rf.write_report( util.format("Incorrect days_since_conversion for the following rows: %s", bad_diffs.toString()));
                else
                    rf.write_report("All days_since_conversion are correct.");
            }
        }
        return queries;
    }
    
};
