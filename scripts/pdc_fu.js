var Baby = require("babyparse");
var util = require('util');
var fs = require('fs');
var rf = require('./reports');

// checks each 'field' in 'row' against each value in 'values',
// returns true if there are any mismatches
function check_fields(row, fields, values, queries, row_ind, given){
    var mismatch_found = false;
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
            mismatch_found = true;
        }
    }
    return mismatch_found;
}

function get_row( row, raw_data ){
    return rf.get_row({"SiteNumber":row.SiteNumber,
                       "SubjectNumber":row.SubjectNumber,
                       "VisitLabel":row.VisitLabel}, 
                       raw_data);
}

function check_all_blank(row, start_ind, end_ind, prefix){
    for (var i=start_ind;i<end_ind;i++){
        if (row[prefix+i]!='')
            return false;
    }
    return true;
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
                    if (check_fields(data[i], ['pdc_a2','pdc_a3','pdc_a4','pdc_a5','pdc_a6','pdc_a8'], ['1','0'], queries, row_ind, "pdc_a1 is 0")){
                        bad_bips.push(row_ind);
                    }
                    if (data[i].pdc_a7=='1'){
                        bad_bips.push(row_ind);
                        queries.push(rf.make_query(data[i], 'pdc_a7', "Should not be 1 given pdc_a1 is 0", row_ind));
                    }
                }
                if ((data[i].pdc_a2=='0'||data[i].pdc_a3=='0'||data[i].pdc_a4=='0') && data[i].VisitLabel!='C'){
                    queries.push( rf.make_query( data[i], 'pdc_a1-3', "Should not be No (0)", row_ind));
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
                    if (check_fields(data[i], ['pdc_a10','pdc_a11','pdc_a12','pdc_a13','pdc_a14','pdc_a15','pdc_a16','pdc_a17','pdc_a18','pdc_a19','pdc_a20','pdc_a21','pdc_a22'], ['1','0'], queries, row_ind, "pdc_a9 is 0")){
                        bad_bips.push(row_ind);
                    }
                }
                if (data[i].pdc_a10=='1'){
                    if (check_fields(data[i], ['pdc_a1','pdc_a2','pdc_a3','pdc_a4','pdc_a5'], ['2',''], queries, row_ind, "pdc_a10 is 1")){
                        bad_bips.push(row_ind);
                    }
                } else if (data[i].pdc_a10=='0'){
                    if (data[i].pdc_a11!='')
                        queries.push( rf.make_query(data[i], 'pdc_a11', "Should be blank given pdc_a10 is 0", row_ind) );
                }
                
                if (data[i].pdc_a12=='1'){
                    if (data[i].pdc_a10 != '1' || data[i].pdc_a11 != '1')   
                        queries.push( rf.make_query(data[i], 'pdc_a12', "Should be No (0) given A10 and A11 are not both 'Yes'", row_ind) );
                        
                    if (data[i].pdc_a13 == '')
                        queries.push( rf.make_query(data[i], 'pdc_a13', "Should not be blank given pdc_a12 is 1", row_ind) );
                        
                    check_fields(data[i], ['pdc_a14','pdc_a15','pdc_a16','pdc_a17','pdc_a18','pdc_a19','pdc_a20','pdc_a21','pdc_a22'], ['1','0'], queries, row_ind, "pdc_a12 is 1");
                        
                } else {
                    if (data[i].pdc_a10 == '1' && data[i].pdc_a11 == '1')   
                        queries.push( rf.make_query(data[i], 'pdc_a12', "Should be Yes (1) given A10 and A11 are both 'Yes'", row_ind) );
                        
                    if (data[i].pdc_a13!='')
                        queries.push( rf.make_query(data[i], 'pdc_a13', "Should be blank given A12 is 0", row_ind) );
                        
                    if (data[i].pdc_a9=='1'){
                        if (data[i].pdc_a14!='1')
                            queries.push( rf.make_query(data[i], 'pdc_a14', "Should be Yes (1) given A9 is Yes (1)", row_ind) );
                    }
                }               
                
                if ( data[i].pdc_a1=='1' && data[i].pdc_a2=='1' && data[i].pdc_a3=='1' && data[i].pdc_a4=='1' && data[i].pdc_a5=='0') {
                    if (data[i].pdc_a16!='1'){
                        queries.push( rf.make_query(data[i], 'pdc_a16', "Should be Yes given A1-A4 are 1 but A5 is 0", row_ind) );
                    }
                }
                if ( (data[i].pdc_a14=='1'&&data[i].pdc_a15=='1') || data[i].pdc_a16=='1'){
                    if (data[i].pdc_a17!='1')
                        queries.push( rf.make_query(data[i], 'pdc_a17', "Should be Yes given BIPS partial remission", row_ind) );
                    else {
                        if (data[i].pdc_a18=='')
                            queries.push( rf.make_query(data[i], 'pdc_a18', "Should not be blank given BIPS partial remission", row_ind) );
                        
                        fields = ['pdc_a19','pdc_a20','pdc_a21','pdc_a22'];
                        for (f in fields){
                            if (data[i][fields[f]]!='')
                                queries.push( rf.make_query(data[i], fields[f], "Should be blank given A17 is Yes (1)", row_ind) );
                        }                    
                    }
                }
                
                if (data[i].pdc_a17=='0'){
                    if (data[i].pdc_a9=='1'){
                        if (data[i].pdc_a19!='1')
                            queries.push( rf.make_query(data[i], 'pdc_a19', "Should be Yes (1) given A9 is Yes (1)", row_ind) );
                    }
                    
                    if (data[i].pdc_a19=='1' && data[i].pdc_a20=='1'){
                        if (data[i].pdc_a21!='1')
                            queries.push( rf.make_query(data[i], 'pdc_a21', "Should be Yes (1) given A19 and A20 are Yes (1)", row_ind) );
                    }
                    
                    if (data[i].pdc_a21=='1'){
                        if (data[i].pdc_a22=='')
                            queries.push( rf.make_query(data[i], 'pdc_a22', "Should not be blank given A21 is Yes (1)", row_ind) );
                    } else {
                        if (data[i].pdc_a22!='')
                            queries.push( rf.make_query(data[i], 'pdc_a22', "Should be blank given A21 is No (0)", row_ind) );
                    }
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
                    queries.push(rf.make_query(data[i], 'pdc_b2', "Should be Yes (1) if symptoms are NOT better accounted for by DSM-V diagnosis", row_ind));
                }
                
                if (data[i]['pdc_b5']=='1'){
                    if (check_fields(data[i], ['pdc_b2','pdc_b3','pdc_b4','pdc_b1'], ['0',''], queries, row_ind, "B5 is yes (1) - participant should meet APS criteria")){
                        bad_aps.push(row_ind);
                    }
                    if (data[i].pdc_b6==''){
                        bad_aps.push(row_ind);
                        queries.push(rf.make_query(data[i], 'B6 (pdc_b6)', "APS onset date required", row_ind));
                    }
                    
                    for (var j=7; j<21; j++){
                        if (data[i]['pdc_b'+j] != '')
                            queries.push(rf.make_query(data[i], 'B'+j, "Should be N/A given B5 is Yes (1)", row_ind));
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
                        queries.push(rf.make_query(data[i], 'pdc_b5', "Should be Yes (1) given items B1-B4 are 1", row_ind));
                        bad_aps.push(row_ind);
                    }
                    
                    if (data[i]['pdc_b7']=='')
                        queries.push(rf.make_query(data[i], 'pdc_b7', "Should not be N/A given item B5 is No (0)", row_ind));
                }

                if (data[i].pdc_b7=='0'){                    
                    if (!check_all_blank(data[i], 8, 21, 'pdc_b')){
                        queries.push(rf.make_query(data[i], 'pdc_b8-20', "Should be N/A given item B7 is No (0)", row_ind));
                    }    
                } else if (data[i].pdc_b7=='1'){
                    if (data[i].pdc_b1=='1'&&data[i].pdc_b2=='1'&&data[i].pdc_b3=='1'){
                        if (data[i].pdc_b8!='1')
                            queries.push(rf.make_query(data[i], 'pdc_b8', "Should be Yes (1) given items B1-B3 are Yes (1)", row_ind));
                    }
                    if (data[i].pdc_b4=='1' && data[i].pdc_b9=='1'){
                        queries.push(rf.make_query(data[i], 'pdc_b9', "Should be No (0) given item B4 is Yes (1)", row_ind));
                    } else if (data[i].pdc_b4=='0' && data[i].pdc_b9=='0')
                        queries.push(rf.make_query(data[i], 'pdc_b9', "Should be Yes (1) given item B4 is No (0)", row_ind));
                    
                    if (data[i].pdc_b8=='1'&&data[i].pdc_b9=='1'){
                        if (data[i].pdc_b10!='1'){
                            queries.push(rf.make_query(data[i], 'pdc_b10', "Should be Yes (1) given items B8 and B9 are Yes (1)", row_ind));
                            
                            if (data[i].pdc_a11!='')
                                queries.push(rf.make_query(data[i], 'pdc_b11', "Should be N/A given item B10 is No (0)", row_ind));
                        } else {
                            if (data[i].pdc_a11!='')
                                queries.push(rf.make_query(data[i], 'pdc_b11', "Should not be N/A given item B10 is Yes (1)", row_ind));
                                
                            if (!check_all_blank(data[i], 12, 21, 'pdc_b')){
                                queries.push(rf.make_query(data[i], 'pdc_b12-20', "Should be N/A given item B10 is Yes (1)", row_ind));
                            } 
                        }
                    }
                }
                
                if (data[i].pdc_b10=='0'){
                    if (data[i].pdc_b7=='1'){
                        if (data[i].pdc_b12!='1')
                            queries.push(rf.make_query(data[i], 'pdc_b12', "Should be Yes (1) given item B7 is Yes", row_ind));
                    }
                    
                    if (data[i].pdc_b1=='1'&&data[i].pdc_b2=='1'&&data[i].pdc_b3=='0'){
                        if (data[i].pdc_b14!='1')
                            queries.push(rf.make_query(data[i], 'pdc_b14', "Should be Yes (1) given B1 and B2 are Yes, B3 is No", row_ind));
                    }
                    
                    if ( (data[i].pdc_b12=='1'&&data[i].pdc_b13=='1') || data[i].pdc_b14=='1'){
                        if (data[i].pdc_b15!='1'){
                            queries.push(rf.make_query(data[i], 'pdc_b15', "Should be Yes (1) given APS partial remission criteria", row_ind));
                        }
                    }
                    
                    if (data[i].pdc_b15=='0'){
                        if (data[i].pdc_b16!='')
                            queries.push(rf.make_query(data[i], 'pdc_b16', "Should be N/A given item B15 is No (0)", row_ind));
                    } else if (data[i].pdc_b15=='1'){
                        if (data[i].pdc_b16=='')                    
                            queries.push(rf.make_query(data[i], 'pdc_b16', "Should not be N/A given item B15 is Yes (1)", row_ind));    
                            
                        if (!check_all_blank(data[i], 17, 21, 'pdc_b')){
                            queries.push(rf.make_query(data[i], 'pdc_b17-20', "Should be N/A given item B15 is Yes (1)", row_ind));
                        } 
                    }
                }
                
                if (data[i].pdc_b15=='0'){
                    if (data[i].pdc_b7=='1'){
                        if (data[i].pdc_b17!='1')
                            queries.push(rf.make_query(data[i], 'pdc_b17', "Should be Yes (1) given item B7 is Yes", row_ind));
                    }
                    
                    if (data[i].pdc_b17=='1'&&data[i].pdc_b18=='1'){
                        if (data[i].pdc_b19!='1')
                            queries.push(rf.make_query(data[i], 'pdc_b19', "Should be Yes (1) given B17 and B18 are Yes", row_ind));
                    }
                    
                    if (data[i].pdc_b19=='0'){
                        if (data[i].pdc_b20!='')
                            queries.push(rf.make_query(data[i], 'pdc_b20', "Should be N/A given item B19 is No (0)", row_ind));
                    } else if (data[i].pdc_b19=='1'){
                        if (data[i].pdc_b20=='')                    
                            queries.push(rf.make_query(data[i], 'pdc_b20', "Should not be N/A given item B19 is Yes (1)", row_ind));
                    }
                }
                                
                //GRD
                if ( (data[i].pdc_c1=='1' || data[i].pdc_c2=='1') && data[i].pdc_c3=='1' ){
                    if (data[i].pdc_c4!='1'){
                        queries.push(rf.make_query(data[i], 'pdc_c4', "Should be Yes (1) given current GRD criteria", row_ind));                        
                        
                    }else{
                        if (!check_all_blank(data[i], 6, 17, 'pdc_c')){
                            queries.push(rf.make_query(data[i], 'pdc_c6-16', "Should be N/A given item C4 is Yes (1)", row_ind));
                        }
                    }
                }
                if ( data[i].pdc_c4=='0' ){
                    if (data[i].pdc_c5!='')
                        queries.push(rf.make_query(data[i], 'pdc_c5', "Should be N/A given current GRD criteria", row_ind));
                        
                    if (data[i].pdc_c6=='0'){
                        if (!check_all_blank(data[i], 7, 17, 'pdc_c'))
                            queries.push(rf.make_query(data[i], 'pdc_c7-16', "Should be N/A given C6 is No (0)", row_ind));
                    }                        
                } else if ( data[i].pdc_c4=='1' ){
                    if (data[i].pdc_c5=='')
                        queries.push(rf.make_query(data[i], 'pdc_c5', "Should not be N/A given current GRD criteria", row_ind));
                }
                
                if (data[i].pdc_c6=='1'){
                    if (data[i].pdc_c7=='1'){
                        if (data[i].pdc_c8!='1')
                            queries.push(rf.make_query(data[i], 'pdc_c8', "Should be Yes (1) given C7 is Yes", row_ind));                        
                    }
                    
                    if (data[i].pdc_c8=='1'){
                        if (data[i].pdc_c9==''){
                            queries.push(rf.make_query(data[i], 'pdc_c9', "Should not be N/A given item C8 is Yes", row_ind));
                        }
                        
                        if (!check_all_blank(data[i], 10, 17, 'pdc_c'))
                            queries.push(rf.make_query(data[i], 'pdc_c10-16', "Should be N/A given C8 is Yes (1)", row_ind));
                        
                    } else if (data[i].pdc_c8=='0'){
                        if (data[i].pdc_c9!=''){
                            queries.push(rf.make_query(data[i], 'pdc_c9', "Should be N/A given item C8 is No", row_ind));
                        }
                    }
                }
                
                if (data[i].pdc_c8=='0'){
                    if (data[i].pdc_c10!='1')
                        queries.push(rf.make_query(data[i], 'pdc_c10', "Should be Yes (1) given item C6 is Yes", row_ind));
                    
                    if ( data[i].pdc_c10=='1' && data[i].pdc_c11=='1' ){
                        if (data[i].pdc_c12==''){
                            queries.push(rf.make_query(data[i], 'pdc_c12', "Should not be N/A given items C10 and C11 are Yes", row_ind));                        
                        }
                    }else{
                        if (data[i].pdc_c12!=''){
                            queries.push(rf.make_query(data[i], 'pdc_c12', "Should be N/A given items C10 and C11 are not both Yes", row_ind));
                        }
                    }
                    if (data[i].pdc_c11=='1'){
                        if (!check_all_blank(data[i], 13, 17, 'pdc_c'))
                            queries.push(rf.make_query(data[i], 'pdc_c13-16', "Should be N/A given C11 is Yes (1)", row_ind));
                    }
                } 
                
                if (data[i].pdc_c11=='0'){
                    if ( data[i].pdc_c13=='1' && data[i].pdc_c14=='1' ){
                        if (data[i].pdc_c15!='1'){
                            queries.push(rf.make_query(data[i], 'pdc_c15', "Should be Yes (1) given items C13 and C14 are Yes", row_ind));                        
                        }
                    }  
                }  
                
                if ( data[i].pdc_c15=='1' ){
                    if (data[i].pdc_c16=='')
                        queries.push(rf.make_query(data[i], 'pdc_c16', "Should not be N/A given item C15 is Yes", row_ind));                        
                } else if ( data[i].pdc_c15=='0' ){
                    if (data[i].pdc_c16!=''){
                        queries.push(rf.make_query(data[i], 'pdc_c16', "Should be N/A given item C15 is No", row_ind));
                    }
                }                            
            }
        }
        
        return queries;
    }
}
