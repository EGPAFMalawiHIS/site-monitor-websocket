'use strict';


// meat

const
	express = require('express'),
	app = express(),
	http = require('http').Server(app),
	io = require('socket.io')(http),
	bcrypt = require('bcrypt'),
	jwt = require('jsonwebtoken'),
	helmet = require('helmet'),
	cors = require('cors'),
	moment = require('moment'),
  cron = require("node-cron"),
  request = require('request'),
  fs = require("fs"),
	bodyParser  = require('body-parser'),
	chaPort        = process.env.PORT || 5001,
  ipaddress = '127.0.0.1';


var users = [];
var db = null;
var JWT_SECRET = '';


// basic setup
app.use(helmet());
app.use(cors());
app.use(express.static('www'));

// get our request parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
 

// function to call django api to get data
let callApi = (socket) => {
  var username = "DJANGO USERNAME";
  var password = "DJANGO PASSWORD";
  var auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
  var url = "http://localhost:8000/api/monitorc/";

    request({
        url: url,
        method: "GET",
        json: true,   // <--Very important!!!
        headers : {
            "Authorization" : auth
        }
    },
      function (error, response, body) {
        
        if (typeof response != "undefined")
        {
            if (response.statusCode == 200 || response.statusCode == 201) {
                
                socket.emit('monitor',JSON.stringify(body));
            }
            else
            {
              console.log('error:::',error);
              
            }
        }
      }
  );
}
 

// home
app.get('/', (req, res) => {
	res.sendfile('index.html');
});
 




// setup socket.io
io.on('connection', socket => {
  callApi(socket);
  cron.schedule("* * * * *", function() {
      console.log("running a task every minute");
      //call the django api data
      callApi(socket);
      
    });


	socket.on('monitor', data => {
		
		console.log('let see',data);
    socket.emit('monitor',data);

	});




	
	var disconnect = () => {
	
		console.log(socket.id + ' could not fully disconnect.');
	};

	socket.on('logout', disconnect);
	socket.on('disconnect', disconnect);
});



const port = process.env.PORT || 5001;
http.listen(port, ipaddress, () => {
	console.log('listening on port', port);
});