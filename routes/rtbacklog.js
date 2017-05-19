"use strict";
var BackLog = require('../models/backlog');
var mime = require('mime');
var AdmZip = require('adm-zip');
var dateFormat = require('dateformat');
const fsextra = require('fs-extra');
var fs = require('fs');
var path = require('path');
var Datastore = require('nedb');
var backLogsURL = path.resolve('localDB/Backlogs.db');
var personsURL = path.resolve('localDB/Persons.db');
var funcAreasURL = path.resolve('localDB/FunctionalAreas.db')
var db = {
  backlogs: new Datastore({ filename: backLogsURL, autoload: true }),
  persons: new Datastore({ filename: personsURL, autoload: true }),
  functionalareas: new Datastore({ filename: funcAreasURL, autoload: true })
};
var momentJS = require('moment');

module.exports = function(app, passport) {

	// ===============================================
    // GET All the BackLogs with Grid filtering Options 
    // ===============================================
    app.get('/backlogs', isLoggedIn, function(req, res, next) {
        // You need to load each database (here we do it asynchronously)
        db.backlogs.loadDatabase();
        db.backlogs.find({}).sort({insertdate: -1}).exec(function(err, items) {
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
        db.persons.find({}).sort({name: 1}).exec(function(err, items) {
            res.json(items);
        });
    });
    // GET All the FunctinalAreas to fill a dropdown 
    // ===============================================
    app.get('/functionalareas', isLoggedIn, function(req, res, next) {
        db.functionalareas.loadDatabase();
        db.functionalareas.find({}).sort({name: 1}).exec(function(err, items) {
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
    //PATCH - partial  (delta) updates to Backlog
    app.patch('/backlogs/:backlogId',isLoggedIn, function(req,res){
        var backlogId = req.params.backlogId;
        var filters = {};
        if(req.body.person)
            filters.person = req.body.person;
        if(req.body.functionalarea)
            filters.functionalarea = req.body.functionalarea;
        if(req.body.idea)
            filters.idea = req.body.idea;
        if(req.body.resolveddate)
            filters.resolveddate = new Date(req.body.resolveddate);

        if(Object.keys(filters).length ==0  || backlogId ==''){
            res.json({message: 'Backlog failed to update!'});
        }
        else
        {
            // Set an existing field's value
            db.backlogs.update({ '_id': backlogId}, { $set: filters }, { multi: false }, function (err, numReplaced) {
                if (err) {
                  return res.json({message: 'Backlog failed to update.!'});
                }
                if(numReplaced == 0){
                   return res.json({message: 'Backlog failed to update'});
                }
                res.json({message: 'Backlog updated.'});
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
    // POST to check SUPER admin password
    // =================================================
    app.post('/checksuperadminpwd', isLoggedIn, function(req, res, next) {    
        if(req.body.superadminpass == app.locals.SuperAdminPassword){
            req.session.isSuperAdmin = true;
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
    // =================================================
    // POST to download Backup files zipped
    // =================================================
    app.post('/getbackup', isLoggedIn, function(req, res, next) {   
        if(req.session.isSuperAdmin){
            //Download only if SuperAdmin - after verifying password.
            // creating archives and adding all the three files to zip
            var zip = new AdmZip();
            var date = new Date();
            var zipPath = app.locals.AppTitle + '_BU_' + dateFormat(date, "yyyy-mm-dd_HHMM");
            var filename = zipPath + '.zip';
            var mimetype = 'application/zip';
            var input = fs.readFileSync(backLogsURL);
            //https://github.com/cthackers/adm-zip/issues/182
            //decimal value of 0644 is 420
            zip.addFile('Backlogs.db', input, '', 420);
            var input2 = fs.readFileSync(personsURL);
            zip.addFile('Persons.db', input2, '', 420);
            var input3 = fs.readFileSync(funcAreasURL);
            zip.addFile('FunctionalAreas.db', input3, '', 420);

            // get everything as a buffer
            var zipBuffer = zip.toBuffer();
            
            res.setHeader('Content-disposition', 'attachment; filename=' + filename);
            res.setHeader('Content-type', mimetype);
            res.send(zipBuffer);
        }
        else
        {
            //for the infinite wait bug.
            res.json({message: 'Super Admin Password Required.!'});
        }
    });
    // =================================================
    // POST to RESET DATABASE.
    // =================================================
    app.post('/dbreset', isLoggedIn, function(req, res, next) {   
        //extra check to see if the user entered the admin password to get the admin popup 
        if(!req.session.isSuperAdmin){
            res.json({
                message: 'Super Admin Password Required.',
                isSuccess: false
            });
        }else{
            var errorOccured = false; 
            if(req.body.backlog){
                fsextra.copy(path.resolve('localDB/ResetDB/Backlogs.db'), backLogsURL, err => {
                    if (err) {
                        console.error(err);
                        errorOccured = true;
                    }
                });
            }
            if(req.body.person){
                fsextra.copy(path.resolve('localDB/ResetDB/Persons.db'),personsURL , err => {
                    if (err) {
                        console.error(err);
                        errorOccured = true;
                    }
                });
            }
            if(req.body.functionalarea){
                fsextra.copy(path.resolve('localDB/ResetDB/FunctionalAreas.db'),funcAreasURL , err => {
                    if (err) {
                        console.error(err);
                        errorOccured = true;
                    }
                });
            }
            if(errorOccured)
                res.json({
                    message: 'DB Reset Failed.',
                    isSuccess: false
                });
            else
                res.json({
                    message: 'DB Reset Successfull.',
                    isSuccess: true
                });
        }
    });
    // =====================================
    // REPORTS PAGE
    // =====================================
    app.get('/report', isLoggedIn, function(req, res, next) {
        // load the index.ejs file
        db.backlogs.loadDatabase();
        db.backlogs.find({}).sort({insertdate: -1}).exec(function(err, items) {
            res.render('report', { 
                title: req.app.locals.AppTitle, 
                pageTitle: req.app.locals.ProjectTitle,
                user : req.user,
                backlogs: items,
                moment: momentJS
                // get the user out of session and pass to template  
            });
        });
    });

    //backlogsfilterandsort
    // ===============================================
    // GET All the BackLogs with filtering and sorting
    // ===============================================
    app.get('/backlogsfilterandsort', isLoggedIn, function(req, res, next) {
        var template = require('fs').readFileSync('./views/layouts/backlog.ejs', 'utf-8');
        // You need to load each database (here we do it asynchronously)
        var filters ={};
        if(req.query.person !='')
            filters.person = req.query.person;
        if(req.query.functionalarea !='')
            filters.functionalarea = req.query.functionalarea;
        if(req.query.idea != '')
            filters.idea = new RegExp(req.query.idea, 'i');
        if(req.query.daterange !=''){
            var dates = req.query.daterange.split(" - ");
            var strtDate = new Date(momentJS(dates[0], 'MM-DD-YYYY').format('YYYY/MM/DD'));
            var endDate = new Date(momentJS(dates[1], 'MM-DD-YYYY').add(1,'days').format('YYYY/MM/DD'));
            filters.insertdate = { $gte : strtDate, $lt : endDate};
        }
        if(req.query.resolved !=''){
            if(req.query.resolved == 'no'){
                filters.resolveddate = null;
            }
            else{
                filters.resolveddate = { $ne: null};
            }
        }

        var sortfilter ={};
        if(req.query.sortfield !=''){
            var sortField = req.query.sortfield;
            var sortOrder = 1;
            if(req.query.sortorder !=''){
                if(req.query.sortorder == 'desc')
                    sortOrder = -1;
                else
                    sortOrder = 1;
            }
            switch(sortField){
                case 'person':
                    var sortfilter = { person : sortOrder};
                    break;
                case 'functionalarea':
                    sortfilter = { functionalarea: sortOrder};
                    break;
                case 'idea':
                    sortfilter = { idea: sortOrder};
                    break;
                case 'backlogdate':
                    sortfilter = { insertdate: sortOrder};
                    break;
            }
        }
        db.backlogs.loadDatabase();
        db.backlogs.find(filters).sort(sortfilter).exec(function(err, items) {
            res.json({
                backlogs: items,
                template: template
            });
        });
    });

    //ANY OTHER ROUTES GO HERE.
    const apiRoutesV1 = require('../routes/api_v1')(app, passport, db);
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
