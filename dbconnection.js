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
        sqlQuery = "select description, image_url, rating, vote, width, height,\n" +
            "(POW(" + color.u + " - X(colorUV),2) + POW(" + color.v + " - Y(colorUV),2)) AS dist\n" +
            "from photos\n" +
            "having dist < " + COLOR_THRESH + "&& width > height * 1.5" + "&& vote >= 0" + " order by dist;";
        console.log(sqlQuery);
        connection.query(sqlQuery, function(err, res) {
            if (err) throw err;
            var random_index;
            var description;
            do {
              random_index = getRandomNumber(0, Math.min(100, res.length));
              if (res[random_index].description === null) {
                break;
              }
              description = res[random_index].description.toLowerCase()
            } while (description.indexOf("macro") > -1); 
            image_url = res[random_index].image_url;
            console.log(image_url)
            console.log("rating: " + res[random_index].rating)
            console.log("width: " + res[random_index].width + "height: " + res[random_index].height)
            console.log("description: " + res[random_index].description)
            func(image_url);
        })
    } catch (err) {

    }
}

function updateVote(url, update, callback) {
  sqlQuery = "update photos set vote=vote+("+update+")" + 
             " where image_url=\"" + url + "\";";
  console.log(sqlQuery)
  connection.query(sqlQuery, function(err, res) {
        console.log("update vote: " + update);
        callback()
      })
}

var http = require('http');
var url = require('url');
var server = http.createServer(function(req, res) {
    try {
        console.log("this is a new server!");
        console.log(req.url)
        parsed_url = url.parse(req.url, true);
        parsed_query = parsed_url.query;
        console.log(parsed_query)
        console.log(parsed_url.pathname)
        if (parsed_url.pathname === '/color') {
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
        } else if (parsed_url.pathname === '/like') {
          console.log("like")
          updateVote(parsed_query["url"], 1, function() {
                res.writeHead(200,  {
                    'Content-Type': 'text/plain',
                    'Access-Contol-Allow-Origin': "*"
                  });
                res.write("ok");
                res.end();
              })
        } else if (parsed_url.pathname === '/dislike') {
          updateVote(parsed_query["url"], -1, function() {
                res.writeHead(200,  {
                    'Content-Type': 'text/plain',
                    'Access-Contol-Allow-Origin': "*"
                  });
                res.write("ok");
                res.end();
              })
        }
    } catch (err) {

    }
})
server.listen(80); //port?

console.log("Server start")
