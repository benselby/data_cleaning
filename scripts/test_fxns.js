module.exports = {
    check_date_diff: function(row, date1, date2, diff, raw_data){
        var bad_diffs = [];
        var d1 = new Date(row[date1].replace(/-/g," "));
        var d2 = new Date(row[date2].replace(/-/g, " "));
        var timeDiff = Math.abs(d2.getTime() - d1.getTime());
        var diffYears = Math.floor(timeDiff / (1000*3600*24*365) ); 
        console.log("years diff:", diffYears);
        console.log("data says :", row[diff]); 
        
        if (diffYears!=row[diff]){
            console.log("Bad!");
        }
    }
}
