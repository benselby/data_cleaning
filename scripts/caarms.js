var Baby = require("babyparse");
var util = require('util');
var fs = require('fs');
var rf = require('./reports');

hr_names = {'caarms_01':'A1',
'caarms_02':'B1',
'caarms_03':'B2',
'caarms_04':'B3',
'caarms_05':'C1a.',
'caarms_06':'C2a.',
'caarms_07':'C1b.',
'caarms_08':'C2b.',
'caarms_09':'C3',
'caarms_10':'C4',
'caarms_11':'C5',
'caarms_12':'D1',
'caarms_13':'D2',
'caarms_14':'D3',
'caarms_15':'D4',
'caarms_16':'D5',
'caarms_17':'D6',
'caarms_18':'E'};

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
            var query = rf.make_query(row, "Item " + hr_names[fields[i]], "Should not be "+ value_string + given_str, row_ind ); 
            queries.push(query);
            return true;
        }
    }
    return false;
}

module.exports = {
    check_data: function(url) {
        
        rf.init_report("CAARMS", './reports/CAARMs.txt', url);
        
        var raw_data, data;
        var queries = [];
        
        raw_data = Baby.parseFiles( url, {header: true} );
            
        data = rf.filter_data_quality(raw_data.data);
        
        if (data.length>1){
            // Run the rest of the data checks here
            for (var i=0; i<data.length; i++) {
                var row_ind = get_row(data[i], raw_data.data);
                
                if (data[i].caarms_01=='0'){
                    var other_fields = ['caarms_02','caarms_03','caarms_04','caarms_05',
                    'caarms_06','caarms_07','caarms_08','caarms_09',
                    'caarms_10','caarms_11','caarms_12','caarms_13',
                    'caarms_14','caarms_15','caarms_16','caarms_17'];
                    check_fields(data[i], other_fields, ['1','0'], queries, row_ind, "item A1 is No (0)");
                    
                    if (data[i].caarms_18!='0')
                        queries.push(rf.make_query(data[i], 'Item E', "Should be No (0) given item A1 is No", row_ind));
                        
                }
                else if (data[i].caarms_01=='1'){
                    if (data[i].caarms_03!='1')
                        queries.push(rf.make_query(data[i], 'Item B2', "Should be Yes (1) given item A1 is Yes", row_ind));
                        
                    if (data[i].caarms_02=='1' && data[i].caarms_03=='1' && data[i].caarms_04!='1')
                        queries.push(rf.make_query(data[i], 'Item B3', "Should be Yes (1) given items B1 and B2 are Yes", row_ind));
                    if (data[i].caarms_10!='1')
                        queries.push(rf.make_query(data[i], 'Item C4', "Should be Yes (1) given item A1 is Yes", row_ind));
                        
                    if (data[i].caarms_11!='1' && ( (data[i].caarms_05=='1'&&data[i].caarms_06=='1'&&data[i].caarms_09=='1'&&data[i].caarms_10=='1') || (data[i].caarms_07=='1'&&data[i].caarms_08=='1'&&data[i].caarms_09=='1'&&data[i].caarms_10=='1') ) )
                        queries.push(rf.make_query(data[i], 'Item C5', "Should be Yes (1)", row_ind));
                        
                    if (data[i].caarms_16!='1')
                        queries.push(rf.make_query(data[i], 'Item D5', "Should be Yes (1) given item A1 is Yes", row_ind));
                        
                    if (data[i].caarms_17!='1' && (data[i].caarms_12=='1'&&data[i].caarms_13=='1'&&data[i].caarms_14=='1'&&data[i].caarms_15=='1'&&data[i].caarms_16=='1'))
                        queries.push(rf.make_query(data[i], 'Item D6', "Should be Yes (1) given items D1-5 are Yes", row_ind));
                        
                    if (data[i].caarms_18!='1' && (data[i].caarms_04=='1'||data[i].caarms_11=='1'||data[i].caarms_17=='1'))
                        queries.push(rf.make_query(data[i], 'Item E', "Should be Yes (1)", row_ind));
                }
            }
        }
        
        return queries;        
    }
}
