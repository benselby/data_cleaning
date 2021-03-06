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
                        
                        var visit = document.createElement("td");
                        visit.textContent = queries[i].visit;
                        row.appendChild(visit);
                        
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

/*
 *  Updates the dropdown list of files 
 */
function showFiles(msg) {
    var elt = document.getElementById("file_select");
    console.log(msg);
    
    msg.forEach( function(name) {
        var option = document.createElement("option");
        option.text = name;
        elt.options.add( option );
    });
    
    elt.addEventListener("change", function(){
        showQuery(elt.options[elt.selectedIndex].text, 0);
    });
}

request({pathname:"./queries"}, function(error, response) {
    if (error)
        alert(error.toString());
    else {
        console.log("requested reports, got:", response);
        showFiles( JSON.parse(response) );
    }
});

var site_select = document.querySelector("#site_select");
site_select.addEventListener("change", function(){
      var filename = document.getElementById("qname").textContent;
      showQuery(filename, site_select.value);
});
