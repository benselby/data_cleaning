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

// Human-readable field names dictionary
hr_names = {'1':'Tobacco',
            '2':'Alcohol',
            '3':'Marijuana/THC',
            '4':'Cocaine',
            '5':'Opiates',
            '6':'PCP',
            '7':'Amphetamines',
            '8':'MDMA/Ecstasy',
            '9':'GHB/Rohypnol',
            '10':'Huffing',
            '11':'Hallucinogens',
            '12':'Other substances'};

module.exports = {
    check_data: function(url) {
        
        rf.init_report("AUS_DUS", './reports/AUS_DUS.txt', url);
        
        var raw_data, data;
        var queries = [];
        
        raw_data = Baby.parseFiles( url, {header: true} );
            
        data = rf.filter_data_quality(raw_data.data);
        
        if (data.length>1){
            // Run the rest of the data checks here
            for (var i=0; i<data.length; i++) {
                var row_ind = get_row(data[i], raw_data.data);
                
                var drugs = ['1','2','3','4','5','6','7','8','9','10','11','12'];                               
                for (j in drugs){
                    var freq_str = hr_names[drugs[j]] + ' - frequency (AusDusFreq' + drugs[j] + ')';
                    var use_str = hr_names[drugs[j]] + ' - usage rating (AusDus' + drugs[j] + ')';
                    
                    if (data[i]['AusDus'+drugs[j]]=='1'&&data[i]['AusDusFreq'+drugs[j]]!='0')
                        queries.push(rf.make_query(data[i], freq_str, "Should be 0 given no use of drug type", row_ind));   
                    else if (data[i]['AusDus'+drugs[j]] > 1 &&data[i]['AusDusFreq'+drugs[j]]=='0')
                        queries.push(rf.make_query(data[i], freq_str, "Should not be 0 given use rating is  greater than 1", row_ind));   
                    
                    if (data[i]['AusDus'+drugs[j]]=='5')
                        queries.push(rf.make_query(data[i], use_str, "Drug dependence with institutionalization", row_ind));              
                    if (data[i]['AusDusFreq'+drugs[j]]=='5' && data[i]['AusDus'+drugs[j]] <= 2)
                        queries.push(rf.make_query(data[i], use_str, "Frequency of 5 indicates abuse (use rating should be 3 or higher)", row_ind));                                  
                }
            }
        }
        
        return queries;        
    }
}
