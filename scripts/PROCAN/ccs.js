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

module.exports = {
    check_data: function(url) {
        
        
        var raw_data, data;
        var queries = [];
        
        raw_data = Baby.parseFiles( url, {header: true} );
            
        data = rf.filter_data_quality(raw_data.data);
        
        if (data.length>1){
            // Run the rest of the data checks here
            for (var i=0; i<data.length; i++) {
                var row_ind = get_row(data[i], raw_data.data);
                
                if (data[i].VisitLabel=='BL')
                    check_fields(data[i], ['ccs_01'], ['1','2'], queries, row_ind, "timepoint is baseline");
                
                if (data[i].ccs_01=='4' && data[i].VisitLabel!='C')
                    queries.push(rf.make_query(data[i], 'Current clinical state', "Should not be 4 unless participant is converted", row_ind));
                    
                if (data[i].ccs_02!='')
                    queries.push(rf.make_query(data[i], 'CAARMS conversion criteria', "Should be blank (cancel code V5)", row_ind));
                    
                if (data[i].ccs_03!='')
                    queries.push(rf.make_query(data[i], 'CAARMS conversion criteria date', "Should be blank (cancel code V5)", row_ind));
            }
        }
        
        return queries;        
    }
}
