"use strict";
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash    = require('connect-flash');
var Datastore = require('nedb');
var dbapp = {};

//mongoose & passport parts
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');

var indexRoutes = require('./routes/index');
var backlogRoutes = require('./routes/rtbacklog');
var users = require('./routes/users');

var app = express();

//Get App constants fro DB file
global.__base = __dirname + '/';
dbapp.appconstants = new Datastore({ filename: path.join(__base , 'localDB', 'Appconstants.db'), autoload: true });
dbapp.appconstants.loadDatabase();
dbapp.appconstants.findOne({},function (err,item){ 
	//console.log(item); 
	//constants to use for the entire application
	app.locals.AppTitle =  item.AppTitle;
	app.locals.ProjectTitle =  item.ProjectTitle;
	app.locals.ContactEmail = item.ContactEmail;
	app.locals.AdminPassword = item.AdminPassword;
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//-- We don't want to serve sessions for static resources
//-- saves database write on every resources
app.use(express.static(path.join(__dirname, 'public')));

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public/favicons', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
//For passport
app.use(require('express-session')({
    secret: 'VeryLongCustomStuffedSecrectKeyFor' + app.locals.AppTitle,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); // use connect-flash for flash messages stored in session

require('./config/passport')(passport); // pass passport for configuration

// routes ======================================================================
indexRoutes(app, passport); // load our routes and pass in our app and fully configured passport
backlogRoutes(app, passport);

app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
