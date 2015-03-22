process.on('uncaughtException', function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});

var mysql = require('mysql');
var connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: '500px'
});

connection.connect();

function rgb2yuv(rgbColor) {
    var y, u, v, r, g, b;
    r = rgbColor.r;
    g = rgbColor.g;
    b = rgbColor.b;

    y = r * .29000 + g * .587000 + b * .114000;
    u = r * -.168736 + g * -.331264 + b * .500000 + 128;
    v = r * .500000 + g * -.418688 + b * -.081312 + 128;
    return {
        y: y,
        u: u,
        v: v,
    };
}

// [l, r)
function getRandomNumber(l, r) {
    return l + Math.floor((Math.random() * (r - l)));
}

function getImageByColor(rgbColor, func) {
    try {
        color = rgb2yuv(rgbColor);
        COLOR_THRESH = 20000;
        sqlQuery = "select image_url,\n" +
            "(POW(" + color.u + " - X(colorUV),2) + POW(" + color.v + " - Y(colorUV),2)) AS dist\n" +
            "from photos\n" +
            "having dist < " + COLOR_THRESH + " order by dist;";
        console.log(sqlQuery);
        connection.query(sqlQuery, function(err, res) {
            if (err) throw err;
            random_index = getRandomNumber(0, Math.min(100, res.length));
            image_url = res[random_index].image_url;
            console.log(image_url)
            func(image_url);
        })
    } catch (err) {

    }
}

var http = require('http');
var url = require('url');
var server = http.createServer(function(req, res) {
    try {
        console.log("this is a new server!");
        console.log(req.url)
        parsed_query = url.parse(req.url, true).query;
        console.log(parsed_query)
        query_color = {
            r: Number(parsed_query["r"]),
            g: Number(parsed_query["g"]),
            b: Number(parsed_query["b"])
        };
        getImageByColor(query_color, function(string) {
            res.writeHead(200, {
                'Content-Length': string.length,
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': "*"
            });
            res.write(string);
            res.end();
        });
    } catch (err) {

    }
})
server.listen(80); //port?

console.log("Server start")
