"use strict";
var BackLog = require('../models/backlog');
var path = require('path');
var Datastore = require('nedb');
var db = {
  backlogs: new Datastore({ filename: path.resolve('localDB/Backlogs.db'), autoload: true }),
  persons: new Datastore({ filename: path.resolve('localDB/Persons.db'), autoload: true }),
  functionalareas: new Datastore({ filename: path.resolve('localDB/FunctionalAreas.db'), autoload: true })
};
module.exports = function(app, passport) {
	// ===============================================
    // GET All the BackLogs with Grid filtering Options 
    // ===============================================
    app.get('/backlogs', isLoggedIn, function(req, res, next) {
        // You need to load each database (here we do it asynchronously)
        db.backlogs.loadDatabase();
        db.backlogs.find({}, function(err, items) {
            res.json(items);
        });
    });
    // =================================================
    // GET the Certian Backlog with I - to show on popup 
    // =================================================
    app.get('/backlogs/:backlogId',isLoggedIn, function (req, res, next) {
        var backlogId = req.params.backlogId;
        //console.log(req.parms);
        db.backlogs.loadDatabase();
        db.backlogs.findOne({'_id': backlogId}, function(err, item) {
            res.json(item);
        });
    });

    // GET All the Persons to fill a dropdown 
    // ===============================================
    app.get('/persons', isLoggedIn, function(req, res, next) {
        db.persons.loadDatabase();
        db.persons.find({}, function(err, items) {
            //console.log('----Inside pers get');
            //console.log(items);
            res.json(items);
        });
    });
    // GET All the FunctinalAreas to fill a dropdown 
    // ===============================================
    app.get('/functionalareas', isLoggedIn, function(req, res, next) {
        db.functionalareas.loadDatabase();
        db.functionalareas.find({}, function(err, items) {
            res.json(items);
        });
    });

    // =================================================
    // POST to add new backlog
    // =================================================
    app.post('/backlogs', isLoggedIn, function(req, res, next) {
        if(req.body.person =='' || req.body.functionalarea =='' || req.body.idea ==''){
            res.json({message: 'Backlog cannot be created.'});
        }
        else{
            db.backlogs.insert({
                        person : req.body.person, 
                        functionalarea : req.body.functionalarea, 
                        idea: req.body.idea, 
                        insertdate: new Date() 
                },function(err, item) {
                    //res.json(item);
                    //console.log(item);
                    res.json({message: 'Backlog created successfully.!'});
            });
        }
    });
    // =================================================
    // POST to check admin password
    // =================================================
    app.post('/checkadminpwd', isLoggedIn, function(req, res, next) {    
        if(req.body.adminpass == app.locals.AdminPassword){
            req.session.isAdmin = true;
            res.json({
                isValid: true
            });
        }else{
            res.json({
                isValid: false
            });
        }
    });
    // =================================================
    // POST to add new person
    // =================================================
    app.post('/persons', isLoggedIn, function(req, res, next) {    
        //extra check to see if the user entered the admin password to get the admin popup
        if(req.body.person == '' || !(req.session.isAdmin)){
            res.json({message: 'Person cannot be created.'});
        }
        else{
             db.persons.insert({
                        name : req.body.person
                },function(err, item) {
                    res.json({message: 'Person created successfully.!'});
            });
        }
    });
    // =================================================
    // POST to add new functional area
    // =================================================
    app.post('/functionalareas', isLoggedIn, function(req, res, next) {   
        //extra check to see if the user entered the admin password to get the admin popup 
        if(req.body.functionalarea == ''|| !(req.session.isAdmin)){
            res.json({message: 'Functional Area cannot be created.'});
        }else{
             db.functionalareas.insert({
                        name : req.body.functionalarea
                },function(err, item) {
                    res.json({message: 'Functional area created successfully.!'});
            });
        }
    });
};
var getClientFilter = function(query) {
    var result = {
        idea: new RegExp(query.idea, "i")
        // functionalarea: query.functionalarea,
        // person: query.person
    };
    if(query.insertdate) {
        //result.insertdate = { $gte: new Date(query.insertdate).toISOString() }
    }
    if(!query.functionalarea =='**select one') {
        result.functionalarea = query.functionalarea;
    }
    if(query.insertdate) {
        //result.insertdate = { $gte: new Date(query.insertdate).toISOString() }
    }
    return result;
};
// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated()){
    	//console.log('yes its authenticated');
        return next();
    }
    // if they aren't redirect them to the home page
    res.redirect('/login');
}
