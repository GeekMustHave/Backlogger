"use strict";

// app/models/user.js
// load the things we need
//var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// create the model for users and expose it to our app

class User {
    constructor (firstname, lastname, username, email,password) {
        this.firstname = firstname;
        this.lastname = lastname;
        this.username = username;
        this.email = email;
        this.password = password;
    }

    generateHash(password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    }

    // checking if password is valid
    validPassword(password) {
        return bcrypt.compareSync(password, this.password);
    }
}
module.exports = User;