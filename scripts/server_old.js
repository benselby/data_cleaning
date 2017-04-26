var http = require("http"), fs = require("fs");

var conversion = require("./scripts/conversion.js");
var cannabis = require("./scripts/cannabis.js");
var demographics = require("./scripts/demographics.js");
var scid = require("./scripts/scidiv.js");
var pdc_bl = require("./scripts/pdc_bl.js");
var sops = require("./scripts/sops.js");
var gaf = require("./scripts/gaf.js");
var spdc = require("./scripts/spdc.js");
var pdc_fu = require("./scripts/pdc_fu");
var ccs = require("./scripts/ccs")
var caarms = require("./scripts/caarms");
var cogdis = require("./scripts/cogdis");
var cbi = require("./scripts/cbi");
var trauma = require("./scripts/trauma");
var aus = require("./scripts/aus");

var scid_cdss = require("./scripts/scid_cdss");

var script_dict = {"Conversion":conversion.check_data,
                   "Cannabis":cannabis.check_data,
                   "ClientInfo":demographics.check_data,
                   "SCIDIV":scid.check_data,
                   "PDC_BL":pdc_bl.check_data,
                   "PDC":pdc_fu.check_data,
                   "SOPS":sops.check_data,
                   "GAF":gaf.check_data,
                   "SPDC":spdc.check_data,
                   "CCS":ccs.check_data,
                   "CARRMS":caarms.check_data,
                   "COGDIS":cogdis.check_data,
                   "CBI":cbi.check_data,
                   "Trauma":trauma.check_data,
                   "AUS_DUS":aus.check_data};                   

var reports = Object.create(null);
var methods = Object.create(null);
var cross_checks = Object.create(null);

function CrossCheck(name, script, queries, url1, url2){
    this.report_name = name;
    this.check_data = script;
    this.queries = queries;
    this.url1 = url1;
    this.url2 = url2;
}

function Report(name, script, queries){
    this.report_name = name;
    this.check_data = script;
    this.queries = queries;
}

methods.GET = function(path, respond) {
    console.log("GET requested path:", path);
    fs.stat(path, function(error, stats) {
        var test = /^\.\/queries\/([^\/]+)/.exec(path);
        var names = [];
        for (r in reports){
            names.push(reports[r].report_name);
        }
        
        if ( test  && names.indexOf(test.slice(1)[0]) != -1 ){
            respond(200, reports[test.slice(1)[0]].queries, "application/json");
        } else if (error && error.code == "ENOENT"){
            respond(404, "File not found");
        } else if (error){
            respond(500, error.toString());
        } else if (stats.isDirectory()) {       
            console.log("is dir!");  
            if (path=="./")
                respond(200, fs.createReadStream("index.html"), "text/html");
            else if (path=="./reports"){
                respond(200, Object.keys(script_dict).join() );
            }
            else
                fs.readdir(path, function(error, files) {
                    if (error)
                        respond(500, error.toString());
                    else
                        respond(200, "Hey you! Get outta here.");
                });
        } else {
            respond(200, fs.createReadStream(path), require("mime").lookup(path));            
        }
    });
}

function urlToPath(url) {
    var path = require("url").parse(url).pathname;
    return "." + decodeURIComponent(path);
}

http.createServer(function(request, response) {
    function respond(code, body, type) {
        if (!type) type = "text/plain";
        response.writeHead(code, {"Content-Type": type});
        
        if (type=="application/json"){
            body = JSON.stringify(body);
        }
        if (body && body.pipe)
            body.pipe(response);
        else
            response.end(body);
    }

    if (request.method in methods)
        methods[request.method](urlToPath(request.url), 
                                respond, request);
    else
        respond(405, "Method " + request.method + " not allowed.");
}).listen(8000);

console.log("Okay, server is running.");

var data_filenames = fs.readdirSync('data/');

console.log("Found the following data files:", data_filenames);

// Run within-measures checks for each file 
for (var i=0; i<data_filenames.length; i++) {
    script_found = false;
    var test = /^(N3_)([\w_]+)\.csv/.exec(data_filenames[i]);
    if (test) {  
        for (key in script_dict) {
            if (key==test[2]) {
                var queries = script_dict[key]("data/".concat(data_filenames[i]));                   
                script_found = true;                     
                reports[key] = new Report(key, script_dict[key], queries);
                console.log(key, ":", reports[key].queries.length);
                break;
            }    
        }
    }
    
    if (!script_found) {
        console.log("No script found for", data_filenames[i]);
    }
}

// Run cross-check scripts
cross_checks["SCID-CDSS"] = new CrossCheck("SCID-CDSS", scid_cdss.check_data, null, "./data/N3_SCIDIV.csv", "./data/N3_CDSS.csv");

for (i in cross_checks){
    cross_checks[i].queries = cross_checks[i].check_data(cross_checks[i].url1, cross_checks[i].url2);     
    console.log(cross_checks[i].report_name,":",cross_checks[i].queries.length);
}
