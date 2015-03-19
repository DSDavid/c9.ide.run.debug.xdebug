var net = require("net");
var port = parseInt("{PORT}", 10);

if (isNaN(port))
    port = 15155;

var browserBuffer = []
    , debugBuffer = []
    , browserClient
    , debugClient;

var MAX_RETRIES = 100;
var RETRY_INTERVAL = 300;

var log = console.log;

console.warn = console.log = function() {
    return console.error.apply(console, arguments);
};
function send() {
    log.apply(console, arguments);
}

var host = "127.0.0.1";

// ---

var browserServer = net.createServer(function(client) {
    console.log("browserClient::connect");
    
    if (browserClient)
        browserClient.end();
    
    browserClient = client;
    debugBuffer = [];
    
    browserClient.on("end", function() {
        console.log("browserClient::end");
        if (debugClient)
            debugClient.end();
        browserClient = null;
    });
    
    browserClient.on("data", function(data) {
        console.log("browserClient::data:", data.toString("utf8"));
        if (debugClient) {
            debugClient.write(data);
        } else {
            debugBuffer.push(data);
        }
    });
    
    if (browserBuffer.length) {
        browserBuffer.forEach(function(data) {
            browserClient.write(data);
        });
        browserBuffer = [];
    }
});

browserServer.listen(port + 1, host, function() {
    console.log("netproxy listening for browser on port " + (port+1));
    start();
});

browserServer.on("error", function(err) {
    console.log(err);
    process.exit(0);
});

// ---

var debugServer = net.createServer(function(client) {
    console.log("debugClient::connect");
    
    if (debugClient)
        debugClient.end();
        
    debugClient = client;
    
    debugBuffer = [];
    browserBuffer = [];
    
    debugClient.on("end", function() {
        console.log("debugClient::end");
        debugClient = null;
        if (browserClient)
            browserClient.end();
    });
    
    debugClient.on("data", function(data) {
        console.log("debugClient::data:", data.toString("utf8"));
        if (browserClient) {
            browserClient.write(data);
        } else {
            browserBuffer.push(data);
        }
    });
    
    if (debugBuffer.length) {
        debugBuffer.forEach(function(data) {
            debugClient.write(data);
        });
        debugBuffer = [];
    }
});

debugServer.listen(port, host, function() {
    console.log("netproxy listening for debugger on port " + port);
    start();
});

debugServer.on("error", function(err) {
    console.log(err);
    process.exit(0);
});

// --

var I=0;
function start() {
    if (++I == 2)
        send("ß");
}