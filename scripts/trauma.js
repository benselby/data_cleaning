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
        
        rf.init_report("Trauma", './reports/Trauma.txt', url);
        
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
            for (var i=0; i<data.length; i++) {
                var row_ind = get_row(data[i], raw_data.data);
                var types = ['trauma_01','trauma_02','trauma_03','trauma_04','trauma_05','trauma_06'];
                                
                for (j in types){
                    var fields = [types[j]+'a',types[j]+'b',types[j]+'c',
                                  types[j]+'d',types[j]+'e',types[j]+'f'];
                    if (data[i][fields[0]]=='0'){
                        check_fields(data[i], fields.slice(1), [''], queries, row_ind, 'trauma has not occurred');
                    } else if (data[i][fields[0]]=='1'){
                        check_fields(data[i], fields.slice(1,fields.length-1), ['0','1'], queries, row_ind, 'trauma has occurred');
                        if (data[i][fields[5]]<1 || data[i][fields[5]]>5){
                            queries.push(rf.make_query(data[i], fields[5]+' - Impact', "Should be 1-5", row_ind));
                        }
                    }                    
                }
            }
        }
        
        return queries;        
    }
}
