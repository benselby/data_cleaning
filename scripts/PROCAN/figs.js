var Baby = require("babyparse");
var util = require('util');
var fs = require('fs');
var rf = require('../reports');

function get_row( row, raw_data ){
    return rf.get_row({"SiteNumber":row.SiteNumber,
                       "SubjectNumber":row.SubjectNumber,
                       "VisitLabel":row.VisitLabel,
                       "FIGS_Relation":row.FIGS_Relation}, 
                       raw_data);
}


module.exports = {
    check_data: function(url) {
        
        var raw_data, data;
        var queries = [];
        
        raw_data = Baby.parseFiles( url, {header: true} );
        data = rf.filter_data_quality(raw_data.data);
        
        if (data.length>1){
            // Run the rest of the data checks here
            data.forEach( function(row) {
                var row_ind = get_row(row, raw_data.data);
                if (row.FIGS_Schizophrenia>=3){
                    if (row.FIGS_Psychotic<3)
                        queries.push(rf.make_query(row, '\'Any Psychosis\' code', "Too low (" +row.FIGS_Psychotic + ") given Schizophrenia / affective / phreniform code of "+ row.FIGS_Schizophrenia, row_ind));
                }
            });
        }
        
        return queries;        
    }
}
