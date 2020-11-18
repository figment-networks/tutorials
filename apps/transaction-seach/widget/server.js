var http = require("http");
var https = require("https");

const PORT = process.env.PORT || 8080;
const DATAHUB_ADDRESS = process.env.DATAHUB_ADDRESS || "cosmos--search.datahub.figment.io";
const DATAHUB_KEY = process.env.DATAHUB_KEY;

//create a server object:
http.createServer(function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    const options = {
      hostname: DATAHUB_ADDRESS,
      path: req.url,
      headers: {
        "authorization": DATAHUB_KEY,
        "Content-Type": "application/json",
        "accept": "*/*",
        "content-length": req.headers["content-length"],
      },
      method: "POST",
    };

    hReq = https.request(options, (innerRes) => {
      innerRes.headers['content-type'] = 'application/json';
      res.writeHead(innerRes.statusCode, innerRes.headers);

      innerRes.on("error", (error) => {
        res.write(error);
        res.end();
      });
      innerRes.on("data", (data) => {
        res.write(data);
      });

      innerRes.on("end", () => {
        res.end();
        hReq.end();
      });
    });

    req.on('data', data => {
        hReq.write(data)
    })

  })
  .listen(PORT);
