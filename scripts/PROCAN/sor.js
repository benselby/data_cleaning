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

module.exports = {
    check_data: function(url) {
        
        var raw_data, data;
        
        var queries = [];
        
        raw_data = Baby.parseFiles( url, {header: true} ); 
            
        data = rf.filter_data_quality(raw_data.data);
        
        if (data.length>1){
            // Get all participants with remission timepoint
            var remissions = data.filter( function(pt) { 
                return pt.stage_of_risk_01=='9'; 
            });
            
            var remission_ids = [];                
            remissions.forEach( function(pt) {
                var id = pt.SiteNumber + '_' + pt.SubjectNumber;
                if (remission_ids.indexOf(id) == -1){
                    remission_ids.push(id);
                    all_pt = data.filter( function(row) { 
                        return row.SiteNumber==pt.SiteNumber && row.SubjectNumber==pt.SubjectNumber;
                    });    
                    for (var i=all_pt.length-1; i>0; i--){
                        if (all_pt[i].stage_of_risk_01=='9'){
                            if (['2','3','9'].indexOf( all_pt[i-1].stage_of_risk_01)==-1){
                                var row_ind = get_row(all_pt[i], raw_data.data);
//                                queries.push(rf.make_query(all_pt[i], 'Stage of Risk', 'Cannot be in remission given previous stage of '+all_pt[i-1].stage_of_risk_01, row_ind));
                            }
                        }
                    }
                }
                else {
                    return;
                }
            });
            
            //Has the participant changed stage? Improvement or worsening?
            var done = [];           
            
            data.forEach( function(row) {
                var row_ind = get_row(row, raw_data.data);
                
                var id = row.SiteNumber + '_' + row.SubjectNumber;
                if (done.indexOf(id) == -1){
                    done.push(id);
                    
                    all_pt = data.filter(function(pt) { 
                        return row.SiteNumber==pt.SiteNumber && row.SubjectNumber==pt.SubjectNumber;
                    });
                    
                    if (all_pt[0].stage_of_risk_12!=''){
                        queries.push(rf.make_query(all_pt[0], 'Change of stage', 'Should be N/A at baseline', row_ind));
                    }    
                    for (var i=1; i<all_pt.length; i++){
                        if (all_pt[i].stage_of_risk_12=='1' && all_pt[i].stage_of_risk_01==all_pt[i-1].stage_of_risk_01)
                            queries.push(rf.make_query(all_pt[i], 'Change of stage', 'Should be No (0) given no change', row_ind));
                            
                        if (all_pt[i].stage_of_risk_12=='0' && all_pt[i].stage_of_risk_01!=all_pt[i-1].stage_of_risk_01)
                            queries.push(rf.make_query(all_pt[i], 'Change of stage', 'Should be Yes (1) given change of stage', row_ind));
                            
                        if (all_pt[i].stage_of_risk_12=='1'){
                            if (all_pt[i].stage_of_risk_13=='1' && all_pt[i].stage_of_risk_14=='1')
                                queries.push(rf.make_query(all_pt[i], 'Improvement/worsening', 'Cannot be both improving and worsening', row_ind));
                            
                            if (all_pt[i].stage_of_risk_01!='9'){
                                if (all_pt[i].stage_of_risk_13=='1' && all_pt[i].stage_of_risk_01>all_pt[i-1].stage_of_risk_01)
                                    queries.push(rf.make_query(all_pt[i], 'Improvement', 'Participant stage worsened', row_ind));

                                if (all_pt[i].stage_of_risk_14=='1' && all_pt[i].stage_of_risk_01<all_pt[i-1].stage_of_risk_01)
                                    queries.push(rf.make_query(all_pt[i], 'Worsening', 'Participant stage improved', row_ind));                            
                            }
                        } else if (all_pt[i].stage_of_risk_12=='0'){
                            if (all_pt[i].stage_of_risk_13!='' && all_pt[i].stage_of_risk_14!='')
                                queries.push(rf.make_query(all_pt[i], 'Improvement/worsening', 'Should be blank given no change of stage', row_ind));
                        }
                    }                    
                }
                
                if (row.VisitLabel=='BL'){
                    if (row.stage_of_risk_01=='9')
                        queries.push(rf.make_query(row, 'Stage of Risk', 'Cannot be in remission at baseline', row_ind));
                    
                    if (row.stage_of_risk_01=='4')
                        queries.push(rf.make_query(row, 'Stage of Risk', 'Cannot be stage 4 at baseline', row_ind));     
                }
                
                var fields = ['02','03','04','05','06'];
                if (row.stage_of_risk_01=='1'){
                    for (var j=0; j<fields.length; j++){
                        if (row['stage_of_risk_'+fields[j]]=='')
                            queries.push(rf.make_query(row, 'Stage 1 details', 'Should not be blank given participant is stage 1', row_ind));
                    }
                } else {
                    for (var j=0; j<fields.length; j++){
                        if (row['stage_of_risk_'+fields[j]]!='')
                            queries.push(rf.make_query(row, 'Stage 1 details', 'Should be blank given participant is not stage 1', row_ind));
                    }
                }
                
                fields = ['07','08','09','10','11'];
                if (row.stage_of_risk_01=='3'){
                    for (var j=0; j<fields.length; j++){
                        if (row['stage_of_risk_'+fields[j]]=='')
                            queries.push(rf.make_query(row, 'Stage 3 details', 'Should not be blank given participant is stage 3', row_ind));
                    }
                } else {
                    for (var j=0; j<fields.length; j++){
                        if (row['stage_of_risk_'+fields[j]]!='')
                            queries.push(rf.make_query(row, 'Stage 3 details', 'Should be blank given participant is not stage 3', row_ind));
                    }
                }
            });
        }
        return queries;
    }
}
