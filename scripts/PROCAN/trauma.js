var Baby = require("babyparse");
var util = require('util');
var fs = require('fs');
var rf = require('../reports');

trauma_dict = {'trauma_01a':'Psychological bullying - Occurrence',
               'trauma_01b':'Psychological bullying - Age (0-6 years)',
               'trauma_01c':'Psychological bullying - Age (7-12 years)',
               'trauma_01d':'Psychological bullying - Age (13-17 years)',
               'trauma_01e':'Psychological bullying - Duration',
               'trauma_01f':'Psychological bullying - Impact',
               'trauma_02a':'Physical bullying - Occurrence',
               'trauma_02b':'Physical bullying - Age (0-6 years)',
               'trauma_02c':'Physical bullying - Age (7-12 years)',
               'trauma_02d':'Physical bullying - Age (13-17 years)',
               'trauma_02e':'Physical bullying - Duration',
               'trauma_02f':'Physical bullying - Impact',
               'trauma_03a':'Emotional neglect - Occurrence',
               'trauma_03b':'Emotional neglect - Age (0-6 years)',
               'trauma_03c':'Emotional neglect - Age (7-12 years)',
               'trauma_03d':'Emotional neglect - Age (13-17 years)',
               'trauma_03e':'Emotional neglect - Duration',
               'trauma_03f':'Emotional neglect - Impact',
               'trauma_04a':'Psychological abuse - Occurrence',
               'trauma_04b':'Psychological abuse - Age (0-6 years)',
               'trauma_04c':'Psychological abuse - Age (7-12 years)',
               'trauma_04d':'Psychological abuse - Age (13-17 years)',
               'trauma_04e':'Psychological abuse - Duration',
               'trauma_04f':'Psychological abuse - Impact',
               'trauma_05a':'Physical abuse - Occurrence',
               'trauma_05b':'Physical abuse - Age (0-6 years)',
               'trauma_05c':'Physical abuse - Age (7-12 years)',
               'trauma_05d':'Physical abuse - Age (13-17 years)',
               'trauma_05e':'Physical abuse - Duration',
               'trauma_05f':'Physical abuse - Impact',
               'trauma_06a':'Sexual abuse - Occurrence',
               'trauma_06b':'Sexual abuse - Age (0-6 years)',
               'trauma_06c':'Sexual abuse - Age (7-12 years)',
               'trauma_06d':'Sexual abuse - Age (13-17 years)',
               'trauma_06e':'Sexual abuse - Duration',
               'trauma_06f':'Sexual abuse - Impact'};

function get_row( row, raw_data ){
    return rf.get_row({"SiteNumber":row.SiteNumber,
                       "SubjectNumber":row.SubjectNumber,
                       "VisitLabel":row.VisitLabel}, 
                       raw_data);
}

// checks each 'field' in 'row' against each value in 'values',
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
            var query = rf.make_query(row, trauma_dict[fields[i]], "Should be "+ value_string + given_str, row_ind ); 
            queries.push(query);            
        }
    }
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
                var types = ['trauma_01','trauma_02','trauma_03','trauma_04','trauma_05','trauma_06'];
                var types_str = ['Psychological bullying', 'Physical bullying','Emotional neglect',
                'Psychological abuse','Physical abuse','Sexual abuse'];
                                
                for (j in types){
                    var fields = [types[j]+'a',types[j]+'b',types[j]+'c',
                                  types[j]+'d',types[j]+'e',types[j]+'f'];
                    var fields_str = ['','0-6 years','7-12 years','13-17 years','Duration','Impact'];
                    if (data[i][fields[0]]=='0'){
                        check_fields(data[i], fields.slice(1), [''], queries, row_ind, 'trauma has not occurred');
                    } else if (data[i][fields[0]]=='1'){
                        check_fields(data[i], fields.slice(1,fields.length-1), ['0','1'], queries, row_ind, 'trauma has occurred');
                        if (data[i][fields[5]]<1 || data[i][fields[5]]>5){
                            var f_str = types_str[j]+' - '+fields_str[5]+ ' (' + fields[5] + ')';
                            queries.push(rf.make_query(data[i], f_str, "Should be 1-5", row_ind));
                        }
                    }                    
                }
            }
        }
        
        return queries;        
    }
}
