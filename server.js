var http = require("http"), fs = require("fs");

var conversion = require("./scripts/conversion.js");
var cannabis = require("./scripts/cannabis.js");
var demographics = require("./scripts/demographics.js");
var scid = require("./scripts/scidiv.js");
var pdc_bl = require("./scripts/pdc_bl.js");
var sops = require("./scripts/sops.js");
var gaf = require("./scripts/gaf.js");
var spdc = require("./scripts/spdc.js");

var script_dict = {"Conversion":conversion.check_data,
                   "Cannabis":cannabis.check_data,
                   "ClientInfo":demographics.check_data,
                   "SCIDIV":scid.check_data,
                   "PDC_BL":pdc_bl.check_data,
                   "SOPS":sops.check_data,
                   "GAF":gaf.check_data,
                   "SPDC":spdc.check_data};


var reports = Object.create(null);
var methods = Object.create(null);

methods.GET = function(path, respond) {
    console.log("GET requested path:", path);
    fs.stat(path, function(error, stats) {
        if (error && error.code == "ENOENT")
            respond(404, "File not found");
        else if (error)
            respond(500, error.toString());
        else if (stats.isDirectory()) {         
            if (path=="./")
                respond(200, fs.createReadStream("index.html"), "text/html");
            else
                fs.readdir(path, function(error, files) {
                    if (error)
                        respond(500, error.toString());
                    else
                        respond(200, files.join("\n"));
                });
        } else
            respond(200, fs.createReadStream(path), require("mime").lookup(path));
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

var script_found;
for (var i=0; i<data_filenames.length; i++) {
//    console.log("===================================");
    script_found = false;
    for (key in script_dict) {
        if (data_filenames[i].indexOf(key) >=0 ) {
            script_dict[key]("data/".concat(data_filenames[i]));                   
            script_found = true;                     
            break;
        }    
    }
}




