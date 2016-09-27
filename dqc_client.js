function request(options, callback) {
    var req = new XMLHttpRequest();
    req.open(options.method || "GET", options.pathname, true);
    req.addEventListener("load", function() {
        if (req.status < 400)
            callback(null, req.responseText);
        else
            callback(new Error("Request failed: " + req.statusText));                
    });
    req.addEventListener("error", function() {
        callback(new Error("Network error"));
    });
    req.send(options.body || null);
}

function showReport(report) {
    var elt = document.getElementById("details");
    elt.textContent = report;
    request({pathname:"reports/"+report}, function(error, response) {
        if (error)
            return console.log("Error getting", report, error);
        else {
            elt.textContent = response;
        }
    });
    
    var refresh = document.getElementById("refresh");
    refresh.addEventListener("click", function() {
        request( {method:"PUT", pathname:""} );
    });
}

function get_report_name( data_filename ) {
    return data_filename.substring(3,data_filename.length-4);
}

function showFiles(msg) {
    var elt = document.getElementById("file_text");
    var list = msg.split("\n");
    
    if (list.length > 1) {
        elt.textContent = "Found the following files:";
        
        var table = document.getElementById("file_table");
        table.style.display = '';
               
        list.forEach( function(filename, i) {
            var row = document.createElement("tr");
            var name = document.createElement("td");
            
            name.textContent = filename;
            row.appendChild(name);
            
            var script_found = false;
            
            var report_cell = document.createElement("td");
            for (key in scripts) {
                if (filename.includes(scripts[key])) {
                    var link = document.createElement("button");                 
                    link.textContent = "View Report";
                    report_cell.style.textAlign = "center";
                    link.addEventListener("click", function() {
                        showReport(get_report_name(filename).concat('.txt'));
                    });
                    report_cell.appendChild(link);
                    script_found = true;                                     
                    break;
                }    
            }
            
            if (!script_found) {
                var text = document.createTextNode("No report script found.");
                report_cell.appendChild(text);
            }
            row.appendChild(report_cell);
            table.appendChild(row);
        });
    } else
        elt.textContent = msg;
    
    return elt;
}

var scripts = ["Conversion",
               "Cannabis",
               "ClientInfo",
               "SCIDIV",
               "PDC_BL",
               "SOPS",
               "GAF",
               "SPDC"];

var loading = showFiles("Loading list of data files and running reports...");
request({pathname:"data/"}, function(error, response) {
    if (error)
        alert(error.toString());
    else {
        showFiles(response);
        filenames = response.split("\n");
    }
});
