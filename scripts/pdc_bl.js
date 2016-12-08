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
        
        rf.init_report("PDC_BL", './reports/PDC_BL.txt', url);
        
        var raw_data, data;
        
        var queries = [];
        
        raw_data = Baby.parseFiles( url, {header: true} );
//        if (raw_data.errors) {
//            console.log("Parsed file %s and found the following error:", url);
//            console.log( "\"", raw_data.errors[0].message, "\"" );
//        } else
//            console.log( "Parsed file %s and found no errors.", url );  
        
        data = rf.filter_data_quality(raw_data.data);
            
        if (data.length > 1) {
            var bad_aps = [];
            var bad_grd = [];
            var bad_bips = [];
            
            for (var i=0; i<data.length; i++) {
                var row_ind = get_row(data[i], raw_data.data);
                
                // BIPS checks
                if (data[i].pdc_a1=='1'){                  
                    if ( check_fields(data[i], ['pdc_a2', 'pdc_a3','pdc_a4','pdc_a5','pdc_a6','pdc_a8'], [''], queries, row_ind, "pdc_a1 is 1" ) ) {
                        bad_bips.push(row_ind);                        
                    }
                    
                }
                else if (data[i].pdc_a1=='0') {                 
                    if (data[i]['pdc_a7']=='1'){
                        bad_bips.push( row_ind );
                        rf.add_query(data[i], 'pdc_a7', "Should be 1 given pdc_a1 is 0", row_ind);
                    }
                    if ( check_fields( data[i], ['pdc_a2', 'pdc_a3','pdc_a4','pdc_a5','pdc_a6','pdc_a8'], ['1','0'], queries, row_ind, "pdc_a1 is 0" ) ){
                            bad_bips.push(row_ind);
                    }                    
                }
 
                var targets = ['pdc_a2', 'pdc_a3','pdc_a4'];
                for (j in targets){
                    if (data[i][targets[j]] == '0' && data[i].VisitLabel!='C'){
                        bad_bips.push( row_ind );
                        queries.push( rf.make_query( data[i], targets[j], "Should not be 0 unless participant converted", row_ind ));
                    }
                }
                
                if (data[i]['pdc_a7']=='1'){
                    if (check_fields(data[i], ['pdc_a1', 'pdc_a2','pdc_a3','pdc_a4','pdc_a5','pdc_a6'], ['0',''], queries, row_ind, "pdc_a7 is 1") ){
                        bad_bips.push( row_ind );
                    }
                    if (check_fields( data[i], ['pdc_a8'], [''], queries, row_ind, "pdc_a7 is 1" ) ) {
                        bad_bips.push( row_ind );
                    }                   
                }
                else if (data[i]['pdc_a7']=='0'){                  
                    if (check_fields(data[i], ['pdc_a1', 'pdc_a2','pdc_a3','pdc_a4','pdc_a5','pdc_a6'], ['1'], queries, row_ind, "pdc_a7 is 0") ){
                        bad_bips.push( row_ind );
                    }
                }                                              
                    
                // APS checks -- From Carly's old instructions
//                if (data[i]['pdc_b1'] == '1'){
//                    if (check_fields( data[i], ['pdc_b2','pdc_b3','pdc_b4','pdc_b6'], [''], queries, row_ind, "pdc_b1 is 1" )){
//                        bad_aps.push( row_ind );                     
//                    }             
//                }
//                else if (data[i]['pdc_b1'] == '0'){
//                    if ( check_fields( data[i], ['pdc_b2','pdc_b3','pdc_b4'], ['1','0'], queries, row_ind, "pdc_b1 is 0")){
//                        bad_aps.push( row_ind );  
//                    }
//                    if ( check_fields( data[i], ['pdc_b5'], ['1'], queries, row_ind, "pdc_b1 is 0" ) ) {
//                        bad_aps.push( row_ind );  
//                    }
//                }               
                                
//                if (data[i]['pdc_b2'] == '0'){
//                    queries.push( rf.make_query(data[i], 'pdc_b2', "Should not be 0 if participant is not converted", row_ind) );
//                    bad_aps.push( row_ind );  
//                }
//                
//                if (data[i]['pdc_b5']=='1'){
//                    if ( check_fields( data[i], ['pdc_b1','pdc_b2','pdc_b3','pdc_b4'], ['0',''], queries, row_ind, "pdc_b5 is 1")){
//                        bad_aps.push( get_row(data[i], raw_data.data) );  
//                    } else if (check_fields( data[i], ['pdc_b6'], [''], queries, row_ind, "pdc_b5 is 1" ) ){
//                        bad_aps.push( row_ind );
//                    }
//                }
//                else if (data[i]['pdc_b5']=='0'){
//                    if ( check_fields( data[i], ['pdc_b1','pdc_b2','pdc_b3','pdc_b4'], ['1'], queries, row_ind, "pdc_b5 is 0")){
//                        bad_aps.push( row_ind );  
//                    }
//                }

                // APS checks - designed by Ben based on NAPLS3 codebook
                if (data[i]['pdc_b1'=='0']){
                    if (check_fields( data[i], ['pdc_b2','pdc_b3','pdc_b4','pdc_b6'], ['0','1'], queries, row_ind, 'pdc_b1 is 0') ){
                        bad_aps.push(row_ind);
                    }
                    if (data[i]['pdc_b5']!='0'){
                        bad_aps.push(row_ind);
                        queries.push( rf.make_query( data[i], 'pdc_b5', "Should be 0 given pdc_b1 is 0", row_ind ));
                    }
                }
                                
                
                if (data[i]['pdc_b5']=='1'){
                    
                    if (check_fields(data[i], ['pdc_b1','pdc_b2','pdc_b3','pdc_b4'], ['','0'], queries, row_ind, 'pdc_b5 is 1'))
                        bad_aps.push(row_ind);
                    
                    if (check_fields(data[i], ['pdc_b6'], [''], queries, row_ind, 'pdc_b5 is 1 - need APS criteria date'))
                        bad_aps.push(row_ind);
                }
                
                
                // GRD checks -- Carly's document
                if (data[i]['pdc_c4']=='1'){
                    if ( (data[i]['pdc_c1'] == '1' || data[i]['pdc_c2'] == '1') && data[i]['pdc_c3'] == '0' ){
                        queries.push( rf.make_query( data[i], 'pdc_c1-3', "Bad GRD (pdc_c1-3) given pdc_c4 is 1", row_ind ) );
                        bad_grd.push( row_ind );
                    
                    } else if ((data[i]['pdc_c1'] == '0' && data[i]['pdc_c2'] == '0') && data[i]['pdc_c3'] == '1'){
                        bad_grd.push( row_ind );
                        queries.push( rf.make_query( data[i], 'pdc_c1-3', "Bad GRD (pdc_c1-3) given pdc_c4 is 1", row_ind ) );
                    }
                    
                    if (data[i]['pdc_c5'] == ''){
                        bad_grd.push( row_ind );
                        queries.push( rf.make_query( data[i], 'pdc_c5', "Should not be blank given pdc_c4 is 1", row_ind ) );
                    }
                
                } else if (data[i]['pdc_c4']=='0'){
                    if ( (data[i]['pdc_c1'] == '1' || data[i]['pdc_c2'] == '1') && data[i]['pdc_c3'] == '1' ){
                        bad_grd.push( row_ind );
                        queries.push( rf.make_query( data[i], 'pdc_c1-3', "Bad GRD (pdc_c1-3) given pdc_c4 is 0", row_ind ) );
                    }
                }                
                
            } // END of loop over all data
            
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
        }    
        return queries;
    }// end check_data function
} // end module.exports
