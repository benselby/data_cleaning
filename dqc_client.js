var sites = {'0':'all sites',
             '1':'UCLA',
             '2':'Emory',
             '3':'Harvard',
             '4':'Hillside',
             '5':'UNC',
             '6':'UCSD',
             '7':'Calgary',
             '8':'Yale',
             '9':'UCSF'};

function request(options, callback) {
    var req = new XMLHttpRequest();
    req.open(options.method || "GET", options.pathname, true);
    
    if (options.accept)
        req.setRequestHeader("accept", options.accept);
    
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
    var queries = document.getElementById("queries");
    queries.style.display = "none";

    var elt = document.getElementById("details");
    elt.style.display = '';
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

function showQuery(name, siteid) {
    var report = document.getElementById("details");
    report.style.display = "none";

    var elt = document.getElementById("queries");
    elt.style.display = '';

    var title = document.getElementById("qname");
    qname.textContent = name;
    
    var path = "/queries/" + name;
    
    request({pathname:path, accept:"application/json"}, function(error, response){
        if (error)
            return console.log("Error getting the queries object:", error);
        else {
            var queries = JSON.parse(response);       
            
            var table = document.querySelector("#qtable");
            var site_select = document.querySelector("#site_select");
            var status = document.querySelector("#status");
            
            // Clear the old table
            var rows = table.getElementsByTagName("tr");
            for (var i=rows.length-1; i>0; i--){
                table.removeChild(rows[i]);
            }
            
            if (queries.length==0){
                table.style.display = "none";
                status.textContent = "No queries found.";
            } else {
                table.style.display = '';                
                
                if (site_select.value!=0)
                    queries = queries.filter(function(q){return q.site==site_select.value});
                
                status.textContent = "Found " + queries.length + " queries for " + sites[site_select.value];
                
                if (queries.length==0)
                    table.style.display = 'none';
                else {
                    for (i in queries){  
                        var row = document.createElement("tr");
                        
                        var ind = document.createElement("td");
                        ind.textContent = queries[i].row;
                        row.appendChild(ind);
                        
                        var site = document.createElement("td");
                        site.textContent = queries[i].site;
                        row.appendChild(site);
                        
                        var id = document.createElement("td");
                        id.textContent = queries[i].id;
                        row.appendChild(id);
                        
                        var field = document.createElement("td");
                        field.textContent = queries[i].field;
                        row.appendChild(field);
                        
                        var desc = document.createElement("td");
                        desc.textContent = queries[i].query;
                        row.appendChild(desc);
                        
                        table.appendChild(row);                    
                    }
                }
            }
        }               
    });     
}

function showFiles(msg) {
    var elt = document.getElementById("file_text");
    var list = msg.split(",");
       
    if (list.length > 1) {
        elt.textContent = "Found the following files:";
        
        var table = document.getElementById("file_table");
        table.style.display = '';
               
        list.forEach( function(filename, i) {
            var row = document.createElement("tr");
            var name = document.createElement("td");
            
            name.textContent = filename;
            row.appendChild(name);
            
            var report_cell = document.createElement("td");                     
            var report_link = document.createElement("button");                 
            report_link.textContent = "View Report";
            report_cell.style.textAlign = "center";
            report_link.addEventListener("click", function() {
                showReport(filename.concat('.txt'));
            });
            report_cell.appendChild(report_link);   
            
            var query_cell = document.createElement("td");
            var query_link = document.createElement("button");                 
            query_link.textContent = "View Queries";
            query_cell.style.textAlign = "center";
            query_link.addEventListener("click", function() {
                showQuery(filename);
            });
            query_cell.appendChild(query_link);   

            row.appendChild(report_cell);
            row.appendChild(query_cell);
            
            table.appendChild(row);
        });
    } else
        elt.textContent = msg;
    
    return elt;
}

var loading = showFiles("Loading list of data files and reports...");

request({pathname:"./reports"}, function(error, response) {
    if (error)
        alert(error.toString());
    else {
        console.log("requested reports, got:", response);
        showFiles(response);
        filenames = response.split("\n");
    }
});

var site_select = document.querySelector("#site_select");
site_select.addEventListener("change", function(){
      var filename = document.getElementById("qname").textContent;
      showQuery(filename, site_select.value);
});
