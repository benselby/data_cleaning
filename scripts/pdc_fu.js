var Baby = require("babyparse");
var util = require('util');
var fs = require('fs');
var rf = require('./reports');

// checks each 'field' in 'row' against each value in 'values',
// returns true if there are any mismatches
function check_fields(row, fields, values, queries, row_ind, given){
    for (i in fields){
        if (values.indexOf( row[fields[i]] ) != -1){
            var value_string = '';
            if (values.length > 1)
                value_string = "any of: ";
            for (j in values){
                if (values[j]!='')
                    value_string = value_string + values[j]; 
                else
                    value_string = value_string + "N/A";
                    
                if (j < values.length-1)
                    value_string = value_string + ", ";   
            }
            var given_str = '';
            if (given)
                given_str = " given " + given;
            var query = rf.make_query(row, fields[i], "Should not be "+ value_string + given_str, row_ind ); 
            queries.push(query);
            return true;
        }
    }
    return false;
}

function get_row( row, raw_data ){
    return rf.get_row({"SiteNumber":row.SiteNumber,
                       "SubjectNumber":row.SubjectNumber,
                       "VisitLabel":row.VisitLabel}, 
                       raw_data);
}

module.exports = {
    check_data: function(url) {
        
        rf.init_report("PDC", './reports/PDC.txt', url);
        
        var raw_data, data;
        var queries = [];
        
        raw_data = Baby.parseFiles( url, {header: true} );
//        if (raw_data.errors) {
//            console.log("Parsed file %s and found the following error:", url);
//            console.log( "\"", raw_data.errors[0].message, "\"" );
//        } else
//            console.log( "Parsed file %s and found no errors.", url );  
            
        data = rf.filter_data_quality(raw_data.data);
        
        if (data.length>1){
            // Run the rest of the data checks here
                       
            var bad_bips = [];
            var bad_aps = [];
            var bad_grd = [];
            
            for (var i=0; i<data.length; i++) {
                var row_ind = get_row(data[i], raw_data.data);
                
                // BIPS
                if (data[i]['pdc_a1']=='1'){
                    if (check_fields(data[i], ['pdc_a2','pdc_a3','pdc_a4','pdc_a5','pdc_a6','pdc_a8'], [''], queries, row_ind, "pdc_a1 is 1")){
                        bad_bips.push(row_ind);
                    }
                } else if (data[i]['pdc_a1']=='0'){
                    if (check_fields(data[i], ['pdc_a2','pdc_a3','pdc_a4','pdc_a5','pdc_a6','pdc_a8'], ['1','2'], queries, row_ind, "pdc_a1 is 0")){
                        bad_bips.push(row_ind);
                    }
                    if (data[i].pdc_a7=='1'){
                        bad_bips.push(row_ind);
                        queries.push(rf.make_query(data[i], 'pdc_a7', "Should not be 1 given pdc_a1 is 0", row_ind));
                    }
                }
                if ((data[i].pdc_a2=='0'||data[i].pdc_a3=='0'||data[i].pdc_a4=='0') && data[i].VisitLabel!='C'){
                    queries.push( rf.make_query( data[i], 'pdc_a1-3', "Should not be 0 if participant is not converted", row_ind));
                    bad_bips.push(row_ind);
                }  
                if (data[i].pdc_a7=='1'){
                    if (check_fields(data[i], ['pdc_a1','pdc_a2','pdc_a3','pdc_a4','pdc_a5','pdc_a6'], ['0',''], queries, row_ind, "pdc_a7 is 1")){
                        bad_bips.push(row_ind);
                    }
                    if (data[i].pdc_a8==''){
                        bad_bips.push(row_ind);
                        queries.push( rf.make_query(data[i], 'pdc_a8', "Should not be blank given pdc_a7 is 1", row_ind) );
                    }
                    if (check_fields(data[i], ['pdc_a9','pdc_a10','pdc_a11','pdc_a12','pdc_a13','pdc_a14','pdc_a15','pdc_a16','pdc_a17','pdc_a18','pdc_a19','pdc_a20','pdc_a21','pdc_a22'], ['1','2'], queries, row_ind, "pdc_a7 is 1")){
                        bad_bips.push(row_ind);
                    }
                } else if (data[i].pdc_a7=='0'){
                    if (check_fields(data[i], ['pdc_a1','pdc_a2','pdc_a3','pdc_a4','pdc_a5','pdc_a6'], ['1'], queries, row_ind, "pdc_a7 is 0")){
                        bad_bips.push(row_ind);
                    }
                    if (data[i].pdc_a9==''){
                        bad_bips.push(row_ind);
                        queries.push( rf.make_query(data[i], 'pdc_a9', "Should not be blank given pdc_a7 is 0", row_ind) );
                    }
                }          
                if (data[i].pdc_a9=='1'){
                    if (check_fields(data[i], ['pdc_a10','pdc_a11','pdc_a12','pdc_a13'], [''], queries, row_ind, "pdc_a9 is 1")){
                        bad_bips.push(row_ind);
                    }
                } else if (data[i].pdc_a9=='0'){
                    if (check_fields(data[i], ['pdc_a10','pdc_a11','pdc_a12','pdc_a13','pdc_a14','pdc_a15','pdc_a16','pdc_a17','pdc_a18','pdc_a19','pdc_a20','pdc_a21','pdc_a22'], ['1','2'], queries, row_ind, "pdc_a9 is 0")){
                        bad_bips.push(row_ind);
                    }
                }
                if (data[i].pdc_a10=='1'){
                    if (check_fields(data[i], ['pdc_a1','pdc_a2','pdc_a3','pdc_a4','pdc_a5'], ['2',''], queries, row_ind, "pdc_a10 is 1")){
                        bad_bips.push(row_ind);
                    }
                } else if (data[i].pdc_a10=='0'){
                
                }
                
                //APS
                
                if (data[i]['pdc_b1']=='1'){
                    if (check_fields(data[i], ['pdc_b2','pdc_b3','pdc_b4'], [''], queries, row_ind, "pdc_b1 is 1")){
                        bad_aps.push(row_ind);
                    }
                } else if (data[i]['pdc_b1']=='0'){
                    if (check_fields(data[i], ['pdc_b2','pdc_b3','pdc_b4','pdc_b6'], ['1','2'], queries, row_ind, "pdc_b1 is 0")){
                        bad_aps.push(row_ind);
                    }
                    if (data[i].pdc_b5=='1'){
                        bad_aps.push(row_ind);
                        queries.push(rf.make_query(data[i], 'pdc_b5', "Should not be 1 given pdc_b1 is 0", row_ind));
                    }
                }
                
                if (data[i].pdc_b2=='0' && data[i].VisitLabel!='C'){
                    bad_aps.push(row_ind);
                    queries.push(rf.make_query(data[i], 'pdc_b2', "Should not be 0 if participant is not converted", row_ind));
                }
                
                if (data[i]['pdc_b5']=='1'){
                    if (check_fields(data[i], ['pdc_b2','pdc_b3','pdc_b4','pdc_b1'], ['0',''], queries, row_ind, "pdc_b5 is 1")){
                        bad_aps.push(row_ind);
                    }
                    if (data[i].pdc_b6==''){
                        bad_aps.push(row_ind);
                        queries.push(rf.make_query(data[i], 'pdc_b6', "Should not be N/A given pdc_b5 is 1", row_ind));
                    }
                } else if (data[i]['pdc_b5']=='0'){
                    targets = ['pdc_b2','pdc_b3','pdc_b4','pdc_b1'];
                    var all_one = true;
                    for (t in targets){
                        if (data[i][targets[t]]!='1') {
                            all_one = false;
                            break;
                        }
                    }
                    if (all_one){
                        queries.push(rf.make_query(data[i], 'pdc_b5', "Should not be 0 given pdc_b1-4 are 1", row_ind));
                        bad_aps.push(row_ind);
                    }
                }
                
                //GRD
                if (data[i].pdc_c4=='1'){
                    if ( (data[i].pdc_c1=='1'||data[i].pdc_c2=='1') && data[i].pdc_c3=='0'){
                        bad_grd.push(row_ind);
                        queries.push(rf.make_query(data[i], 'pdc_c1-3', "Bad GRD given pdc_c4 is 1 and pdc_c3 is 0", row_ind));
                    } else if ( (data[i].pdc_c1=='0'&&data[i].pdc_c2=='0') && data[i].pdc_c3=='1'){
                        bad_grd.push(row_ind);
                        queries.push(rf.make_query(data[i], 'pdc_c1-3', "Bad GRD given pdc_c4 is 1 and pdc_c3 is 1", row_ind));
                    }
                    if (data[i].pdc_c5==''){
                        bad_grd.push(row_ind);
                        queries.push(rf.make_query(data[i], 'pdc_c5', "Should not be N/A given pdc_c4 is 1", row_ind));
                    }                    
                } else if (data[i].pdc_c4=='0'){
                    if ( (data[i].pdc_c1==1||data[i].pdc_c2==1) && data[i].pdc_c3=='1'){
                        bad_grd.push(row_ind);
                        queries.push(rf.make_query(data[i], 'pdc_c1-3', "Bad GRD given pdc_c4 is 0 and pdc_c3 is 1", row_ind));
                    }
                }                               
            }
        }
        
        if (bad_bips.length>1)
            rf.write_report(util.format('Bad BIPS (pdc_a) entries for the following %d rows: %s', bad_bips.length, bad_bips.toString()));
        else 
            rf.write_report("All BIPS (pdc_a) entries look good.");
            
        if (bad_aps.length>1)
            rf.write_report(util.format('Bad APS (pdc_b) entries for the following %d rows: %s', bad_aps.length, bad_aps.toString()));
        else 
            rf.write_report("All APS (pdc_b) entries look good.");
        
        if (bad_grd.length>1)
            rf.write_report(util.format('Bad GRD (pdc_c) entries for the following %d rows: %s', bad_grd.length, bad_grd.toString()));
        else 
            rf.write_report("All GRD (pdc_c) entries look good.");
        
        return queries;
    }
}
