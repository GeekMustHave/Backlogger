// config/passport.js
"use strict";

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
//Basic stragey is used for API Basci Authantication check

// load up the user model
var User = require('../models/user');
//For lightweight DB
var path = require('path');
var Datastore = require('nedb');
var db = {
  users: new Datastore({ filename: path.join(__base , 'localDB', 'Users.db'), autoload: true })
};
//console.log('----' + path.join(__base , 'localDB', 'Users.db'));
// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        var sessionUser = { _id: user._id, name: user.firstname + ', ' + user.lastname,
                             email: user.email,
                             username: user.username
                         };
        //done(null, user.email);
        done(null,sessionUser);
    });

    // used to deserialize the user
    passport.deserializeUser(function(sessionUser, done) {
        // The sessionUser object is different from the user mongoose collection
        // it's actually req.session.passport.user and comes from the session collection
        done(null, sessionUser);
        //un neccessary to get again from DB
        // db.users.findOne({'email' : email}, function(err, user) {
        //      if(!err) done(null, user);
        //      else done(err, null);
        // });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) {
            // asynchronous
            // User.findOne wont fire unless data is sent back
            //We are just overriding for our purpose..
            //email = 'guestuser@backlogger.com';
            process.nextTick(function() {

                // find a user whose email is the same as the forms email
                // we are checking to see if the user trying to login already exists
                db.users.findOne({ 'email' :  email }, function(err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);
                    // check to see if theres already a user with that email
                    if (user) {
                        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                    } else {

                        // if there is no user with that email
                        // create the user
                        var newUser             = new User('','','','','');
                        // set the user's local credentials
                        newUser.email     = email;
                        newUser.password  = newUser.generateHash(password);
                        newUser.firstname = 'Guest';
                        newUser.lastname  = 'User';
                        newUser.username  = email;

                        // save the user
                        db.users.insert(newUser, function(err, doc) {
                            //console.log('Inserted', doc.email, 'with ID', doc._id);
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });
            });
    }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'password', //this has to be changed to form field username when we turn on other users logins
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exist(!)
        //For simplicity use the below username and disable the username input on login page
        email = 'guestuser@backlogger.com';
        db.users.findOne({ 'email' :  email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

            var userRef = new User('','','','','');
            // set the user's local credentials
            userRef.password  = user.password;

            // if the user is found but the password is wrong
            if (!userRef.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong Key.')); // create the loginMessage and save it to session as flashdata

            // all is well, return successful user
            return done(null, user);
        });

    }));
    // =========================================================================
    // BASIC STRATEGY API AUTHANTICATION LOGIN =============================================================
    // =========================================================================
    // we are NOT using named strategies since we have only one for BAsic  
    passport.use('basic-login', new BasicStrategy(
      function(username, password, callback) {
        db.users.findOne({ 'username' :  username }, function(err, user) {
          if (err) { return callback(err); }

          // No user found with that username
          if (!user) { return callback(null, false); }

          var userRef = new User('','','','','');
          // set the user's local credentials
          userRef.password  = user.password;
          // if the user is found but the password is wrong
          if (!userRef.validPassword(password))
           {
             return callback(null, false); 
           }
          
          // Success
          return callback(null, user);
        });
      }
    ));
};
