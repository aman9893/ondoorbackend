var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const cors = require('cors');
var fs = require('fs');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:4200",
    origin: 'https://ondoorbackend.vercel.app/',
    methods: ["GET", "POST"]
  }
})
var serverPort = 3001;


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

const corsOptions = {
  origin: 'https://ondoorbackend.vercel.app/',
}

app.use(cors(corsOptions));

app.set('views', path.join(__dirname,'views'));
app.set('view engine','html');


app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
  app.use(cors());
  app.all('*', function(req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Headers", "X-Requested-With");
   next();
});

app.get('/test', (req,res) => res.send('Hello World'))


module.exports = app;

server.listen(serverPort);

console.log("Server Start : " + serverPort );


