/*
 * A general library for functions used in multiple reports.
 */

var util = require('util');
var fs = require('fs');
var report;

//var queries = [];
var missing = [];

var Query = function(id, site, visit, field, query, row) {
    this.id = id;
    this.site = site;
    this.visit = visit;
    this.field = field;
    this.query = query;    
    this.row = row;
};

module.exports = {
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
        
    // returns the row index (in the .csv) of the row which contains the 
    // values specified in the 'keys' object
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
    
    // same as above, but returns the actual row object
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
    
    findZeroRows: function(array, prop, raw_data, queries){
        var passed = [];        
        for (var i=0; i<array.length; i++){
            var row_ind = this.get_data_row( array[i].SiteNumber, array[i].SubjectNumber, raw_data.data );
            if (array[i][prop]==0){
                passed.push( row_ind );
                queries.push( this.make_query( array[i], prop, "Should not be 0", row_ind ) );
            }
        }
        if (passed.length!=0)
            this.write_report( util.format( "%s is zero for %d rows: %s", prop, passed.length, passed.toString()));
        else
            this.write_report( util.format("%s: no zeros", prop)); 
        return passed;
    },

    findBlankRows: function(array, prop, raw_data, queries){
        var passed = [];
        for (var i=0; i<array.length; i++){
            var row_ind = this.get_row( {'SiteNumber':array[i].SiteNumber,                   'SubjectNumber':array[i].SubjectNumber}, raw_data.data );
            if (array[i][prop]===''){
                queries.push( this.make_query( array[i], prop, "Should not be blank", row_ind ) );
                passed.push( row_ind );
            }
        }
        if (passed.length!=0)
            this.write_report( util.format( "%s is blank for %d rows: %s", prop, passed.length, passed.toString()));
        else
            this.write_report( util.format("%s: no blanks", prop)); 
        return passed;
    },
    
    check_date_diff: function(array, date1, date2, diff, raw_data, queries){
        var bad_diffs = [];
        for (var i=0; i<array.length; i++){
            var row_ind = this.get_row( {'SiteNumber':array[i].SiteNumber,                   'SubjectNumber':array[i].SubjectNumber}, raw_data.data );
            if (array[i][date1]==''||array[i][date2]=='')
                continue;            
            var d1 = new Date(array[i][date1].replace(/-/g," "));
            var d2 = new Date(array[i][date2].replace(/-/g, " "));
            var timeDiff = Math.abs(d2.getTime() - d1.getTime());
            var diffYears = Math.floor(timeDiff / (1000*3600*24*365) ); 
            
            if (isNaN(diffYears))
                console.log(array[i][date1], '//', d1, d2, timeDiff, array[i][diff]);
            
            if (diffYears!=array[i][diff]){
                bad_diffs.push(row_ind);                
                queries.push( this.make_query(array[i], diff, "Incorrect age based on "+date1+" and "+date2 + " - should be "+diffYears, row_ind));
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
    },
    
    make_query: function(row, field, query, row_ind) {
        // first, check the missing data stuff to verify that the query is valid
        var id = row.SubjectNumber;
        var site = row.SiteNumber;
        var visit = row.VisitLabel;
        var row_ind;
        
        
        return new Query(id, site, visit, field, query, row_ind);
    },
    
    // returns true if and of the fields in the row are equal to any of values,
    // false otherwise
    check_is_not_equal: function(row, fields, values, queries, row_ind, given) {
        var mismatch_found = false;        
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
                var query = this.make_query(row, fields[i], "Should not be "+ value_string + given_str, row_ind ); 
                queries.push(query);
                mismatch_found = true;
            }
        }
        return mismatch_found;
    },
    
    // returns false if any fields in row are NOT equal to values,
    // true otherwise
//    check_all_equal: function(row, fields, value) {
//        var all_equal = true;        
//        for (i in fields){
//            if (row[fields[i]] != value)
//                all_equal = false;
//        }
//        return all_equal;
//    },
//    
//    range: function(start, end){
//        var out = [];
//        if (start > end)
//            return undefined;
//        for (var i=start; i<end; i++){
//            out.push(i);
//        }
//        return out;
//    },
    
    // Generate a (text? .csv?) file that is human-readable to be used
    // to query individual sites
    generate_query_report: function(path) {

    },
    
    Query: Query
}

//module.exports.queries = queries;


