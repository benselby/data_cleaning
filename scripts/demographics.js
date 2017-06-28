var Baby = require("babyparse");
var util = require('util');
var fs = require('fs');
var rf = require('./reports');

field_dict = {'demo_dad_dob':'Napls3Demo.Demo_19',
            'demo_mom_dob':'Napls3Demo.Demo_21'};

function check_date_diff(array, birth_date, collected_date, diff, raw_data, queries){
    var bad_diffs = [];
    for (var i=0; i<array.length; i++){
        var row_ind = rf.get_row( {'SiteNumber':array[i].SiteNumber,                   'SubjectNumber':array[i].SubjectNumber}, raw_data.data );
        if (array[i][birth_date]==''||array[i][collected_date]=='')
            continue;            
        var bd = new Date(array[i][birth_date].replace(/-/g," "));
        var cd = new Date(array[i][collected_date].replace(/-/g, " "));
    //            var timeDiff = Math.abs(d2.getTime() - d1.getTime());
    //            var diffYears = Math.floor(timeDiff / (1000*3600*24*365) ); 
        var diffYears = cd.getFullYear()-bd.getFullYear();
        var c_month = cd.getMonth();
        var b_month = bd.getMonth();
        var c_day = cd.getDate();
        var b_day = bd.getDate();
        if ( c_month<b_month || (c_month==b_month && c_day<b_day) )
            diffYears--;
                
        if (isNaN(diffYears))
            console.log(array[i][birth_date], '//', bd, cd, timeDiff, array[i][diff]);
        
        if (diffYears!=array[i][diff]&& diffYears>0){
            if (Math.abs(diffYears-array[i][diff])==1 && c_month==b_month)
                continue;
            else               
                queries.push( rf.make_query(array[i], diff, "Incorrect age based on "+birth_date+" and "+collected_date + " - should be "+diffYears + " instead of " + array[i][diff], row_ind));
        }
    }
};

function check_DOB( array, target, raw_data, queries, miss_data ) {
    var bad = [];
    for (var i=0; i<array.length; i++){
        var row_ind = rf.get_data_row( array[i].SiteNumber, array[i].SubjectNumber, raw_data.data );
        if (array[i][target].substring(0,2) != '15') {
            if (array[i][target]=='') {
                var obj_name = 'NAPLS3-0' + array[i].SiteNumber + '-0' + array[i].SubjectNumber;
                var fields = miss_data.filter(function(row){ 
                        return row.CALC_OBJECT_NAME==obj_name; 
                    });
                if ( fields.length > 0 ) {
//                    console.log("Demographics: missing data approved for " + obj_name);
                    continue;
                } else
                    queries.push(rf.make_query(array[i], target, "Should not be blank without corresponding missing code V3", row_ind));    
            }         
            else     
                queries.push(rf.make_query(array[i], target, "Day of date should be 15", row_ind));
        }
    }
};

function check_birth_year(array, raw_data, queries) {
    var fields = ['demo_dob', 'demo_mom_dob', 'demo_dad_dob'];
    
    for (var i=0; i<array.length; i++){
        for (var j=0; j<fields.length; j++){
                var birth_date = new Date( array[i][fields[j]].replace(/-/g, ' ') );
                var birth_year = birth_date.getFullYear();
                var row_ind = rf.get_data_row( array[i].SiteNumber, array[i].SubjectNumber, raw_data.data );
                if (birth_year>2008) {
                    var q_str = "Birth year of " + birth_year + " is inadmissable";
                    queries.push(rf.make_query(array[i], fields[j], q_str, row_ind));
                }        
        }
    }
    
}

module.exports = {
    check_data: function(url) {
        
        rf.init_report("Demographics",'./reports/ClientInfo.txt', url);

        var raw_data, data;
        var queries = [];
        
        raw_data = Baby.parseFiles( url, {header: true} );
            
        data = rf.filter(raw_data.data, function(pt){
            return pt.DataQuality==3||pt.DataQuality==4||pt.DataQuality==5
        });
        
        var m_data = Baby.parseFiles( './data/Missing_Data.csv', {header:true} ).data;
        var miss_data = [];
        
        if (m_data.length==0)
            console.log( "Demographics: failed to load missing data sheet! Proceeding");
        else {        
            miss_data = m_data.filter( function(row) { return row.TASK_NAME=='Demographics'; } ); 
            if (miss_data.length==0)
                console.log( "Demographics: found no missing data - proceeding without.");
        }
                
        if (data.length < 1) {
            rf.write_report( "No rows with appropriate data quality found." );
            return -1;
        } else {
            rf.write_report( util.format( "Using %d of %d rows based on data quality levels 3,4,5", data.length, raw_data.data.length-1));
        }
        
        check_birth_year(data, raw_data, queries);
        check_DOB(data, "demo_dob", raw_data, queries, miss_data);
        check_date_diff( data, 'demo_dob', 'DataCollectedDate', 'demo_age_ym', raw_data, queries);
        check_DOB(data, "demo_dad_dob", raw_data, queries, miss_data);
        check_date_diff( data, 'demo_dad_dob', 'DataCollectedDate', 'demo_dad_age', raw_data, queries);
        check_DOB(data, "demo_mom_dob", raw_data, queries, miss_data);
        check_date_diff( data, 'demo_mom_dob', 'DataCollectedDate', 'demo_mom_Age', raw_data, queries);
        
        return queries;
    }
}
