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

module.exports = {
    check_data: function(aus_url, can_url) {
                
        var queries = [];
        
        var raw_aus = Baby.parseFiles( aus_url, {header: true} ).data;
        var aus_data = rf.filter_data_quality(raw_aus);
        
        var raw_can = Baby.parseFiles( can_url, {header: true} ).data;
        var can_data = rf.filter_data_quality(raw_can);
        
        if (can_data.length>1){
            // Run the rest of the data checks here
            can_data.forEach( function( can_row ) { 
                var can_ind = get_row( can_row, raw_can ) - 2; 
                var aus_ind = get_row( can_row, raw_aus ) - 2; 
                if (aus_ind== -3){
                    return;
                }                
                var aus_row = raw_aus[aus_ind];
                            
                if (aus_row.AusDus3>=2){
                    if (can_row.cannabis_02!='1'){
                        var str = "Should be 'current user' given AUS/DUS usage score of " + aus_row.AusDus3;
                        queries.push(rf.make_query(can_row, 'Cannabis - current or past', str, can_ind+2));
                    }
                    if (can_row.cannabis_05>4){
                        var str = "Should be more frequent given AUS/DUS usage score of " + aus_row.AusDus3;
                        queries.push(rf.make_query(can_row, 'Cannabis - frequency', str, can_ind+2));
                    }
                } 
                
                if (can_row.cannabis_02=='1' && can_row.cannabis_05<=4){
                    if (aus_row.AusDus3 < 2){
                        var str = "Should be >=2 given participant is a current cannabis user on Cannabis Scale";
                        queries.push(rf.make_query(aus_row, 'AUS/DUS - Marijuana Usage', str, aus_ind+2));
                    }
                }                
            }); 
        }        
        return queries;        
    }
}
