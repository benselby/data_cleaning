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
// checks each 'field' in 'row' against each value in 'values',
// returns true if there are any mismatches
function check_fields(row, fields, values, queries, row_ind, given){
    for (i in fields){
        if (values.indexOf( row[fields[i]] ) == -1){
            var value_string = '';
            if (values.length > 1)
                value_string = "one of: ";
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
            var query = rf.make_query(row, fields[i], "Should be "+ value_string + given_str, row_ind ); 
            queries.push(query);
            return true;
        }
    }
    return false;
}

module.exports = {
    check_data: function(url) {
        
        rf.init_report("Cannabis", './reports/Cannabis.txt', url);

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
            var fields = ['1','2','3','4','5','6'];
            var c = 'cannabis_0';
            for (var i=0; i<data.length; i++) {
                var row_ind = get_row(data[i], raw_data.data);
                
                if (data[i][c+'1']=='0'){
                    for (var j=1; j<fields.length; j++){
                        if ( data[i][c+fields[j]]!='' )
                            queries.push(rf.make_query(data[i], c+fields[j], "Should be NA if not a cannabis user", row_ind));              
                    }   
                } else if (data[i][c+'1']=='1'){
//                    if (data[i][c+'2']=='2' && data[i][c+'3']>0)
//                        queries.push(rf.make_query(data[i], c+'2', "Participant should be a current cannabis user if they have used in the past 6 months", row_ind));           
//                    else if (data[i][c+'2']!='2' && data[i][c+'3']=='0')
//                        queries.push(rf.make_query(data[i], c+'2', "Participant should not be a current cannabis user if they have not used in the past 6 months", row_ind));
                        
                    if (data[i][c+'2']=='1'){
                        if (data[i][c+'5']=='8')
                            queries.push(rf.make_query(data[i], c+'5', "Should not be NA (8) if participant is a current user", row_ind));
                        if (data[i][c+'6']!='8')
                            queries.push(rf.make_query(data[i], c+'6', "Should be NA (8) if participant is a current user", row_ind));
                    } else if (data[i][c+'2']=='2'){
                        if (data[i][c+'6']=='8')
                            queries.push(rf.make_query(data[i], c+'6', "Should not be NA (8) if participant is a past user", row_ind));
                        if (data[i][c+'5']!='8')
                            queries.push(rf.make_query(data[i], c+'5', "Should be NA (8) if participant is not a current user", row_ind));
                    }
                }
            }            
        }
        
        return queries;
    }
}
