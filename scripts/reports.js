/*
 * A general library for functions used in multiple reports.
 */

var util = require('util');
var fs = require('fs');
var report;

module.exports = {
//    Flag: function(row, msg){
//        this.row = row;
//        this.msg = msg;
//    },
//    
//    Flag.prototype.test: function() {
//        console.log("Flag contains message:", this.msg);
//    },

    init_report: function(name, report_path, csv_path) {
        report = fs.createWriteStream(report_path, {flags:'w'});
        this.write_header(name, csv_path);
    },

    write_report: function(text, quiet) {
        if (typeof quiet === 'undefined')
            quiet = true;
        report.write(util.format(text) + '\n\n');
        if (!quiet)
            console.log(text);
    },
    
    // WARNING: this function just returns the first instance of a 
    // SubjectNumber and SiteNumber. Therefore it should not be used 
    // for data which contains multiple entries for the same participant. 
    get_data_row: function(site, subject, data) {
        for (var i=0; i<data.length; i++){
            if (data[i].SiteNumber != site)
                continue;
            else if (data[i].SubjectNumber != subject)
                continue;
            else 
                return i+2;
        }
    },
    
    get_row: function(keys, raw_data) {
        var key_list = Object.keys(keys);
        for (var i=0; i<raw_data.length; i++){
            var found = true;
            for (var j=0; j<key_list.length; j++){
                if (raw_data[i][key_list[j]] != keys[key_list[j]]){
                    found = false;
                    break;
                }
            }
            if (found)
                return i+2;
        }
        return -1;
    },

    get_row_data: function(keys, raw_data) {
        var key_list = Object.keys(keys);
        for (var i=0; i<raw_data.length; i++){
            var found = true;
            for (var j=0; j<key_list.length; j++){
                if (raw_data[i][key_list[j]] != keys[key_list[j]]){
                    found = false;
                    break;
                }
            }
            if (found)
                return raw_data[i];
        }
        return -1;
    },
    
    filter_data_quality: function(data, quality_levels) {
        
        if (typeof quality_levels != "object"){
            quality_levels = ['3','4','5'];
        }
        var passed = [];
        for (var i=0; i<data.length; i++) {
            if (quality_levels.indexOf(data[i].DataQuality) != -1)
                passed.push(data[i]);
        }

        if (passed.length < 1) {
            this.write_report( "No rows with appropriate data quality found." );
            return -1;
        } else {
            this.write_report( util.format( "Using %d of %d rows based on data quality levels %s", passed.length, data.length-1, quality_levels.toString()));
        }       
                
        return passed;
    }, 

    filter: function(array, test) {
        var passed = [];
        for (var i=0; i<array.length; i++){
            if (test(array[i]))
                passed.push(array[i]);
            }
        return passed;    
    },
    
    findZeroRows: function(array, prop, raw_data){
        var passed = [];
        for (var i=0; i<array.length; i++){
            if (array[i][prop]==0)
                passed.push(this.get_data_row( array[i].SiteNumber, array[i].SubjectNumber, raw_data.data ) );
        }
        if (passed.length!=0)
            this.write_report( util.format( "%s is zero for %d rows: %s", prop, passed.length, passed.toString()));
        else
            this.write_report( util.format("%s: no zeros", prop)); 
        return passed;
    },

    findBlankRows: function(array, prop, raw_data){
        var passed = [];
        for (var i=0; i<array.length; i++){
            if (array[i][prop]==='')
                passed.push(this.get_data_row( array[i].SiteNumber, array[i].SubjectNumber, raw_data.data ) );
        }
        if (passed.length!=0)
            this.write_report( util.format( "%s is blank for %d rows: %s", prop, passed.length, passed.toString()));
        else
            this.write_report( util.format("%s: no blanks", prop)); 
        return passed;
    },
    
    check_date_diff: function(array, date1, date2, diff, raw_data){
        var bad_diffs = [];
        for (var i=0; i<array.length; i++){
            var d1 = new Date(array[i][date1].replace(/-/g," "));
            var d2 = new Date(array[i][date2].replace(/-/g, " "));
            var timeDiff = Math.abs(d2.getTime() - d1.getTime());
            var diffYears = Math.floor(timeDiff / (1000*3600*24*365) ); 
            if (diffYears!=array[i][diff]){
                bad_diffs.push(this.get_row( {'SiteNumber':array[i].SiteNumber, 
                                              'SubjectNumber':array[i].SubjectNumber}, raw_data.data ) );
            }
        }
        if (bad_diffs.length!=0)
            this.write_report( util.format("Incorrect %s for the following %d rows: %s", diff, bad_diffs.length, bad_diffs.toString()));
        else
            this.write_report(util.format("All %s are correct.", diff));
    },
    
    write_header: function(name, csv_path) {
        var date = new Date();
        var datestr = date.getFullYear() + "-" + (date.getMonth()+1) + '-' + date.getUTCDate();
        
        var mod_date = new Date( fs.statSync(csv_path).mtime );
        var mod_datestr = mod_date.getFullYear() + "-" + (mod_date.getMonth()+1) + '-' + mod_date.getUTCDate();
        
        report.write( util.format("%s Data Report \n", name ));
        report.write( util.format("Source file: %s\n", csv_path));
        report.write( util.format(".csv last modified: %s\n", mod_datestr));
        report.write( util.format("Report generated on %s\n", datestr) );
        report.write("=========================\n");
    }
}
