"use strict";
// const path2 = require('path');
// const Datastore2 = require('nedb');
// const backLogsURL2 = path2.resolve('localDB/Backlogs.db');
// const db2 = {
//   backlogs2: new Datastore2({ filename: backLogsURL2, autoload: true })
// };

module.exports = function(app, passport, db) {
	// ===============================================
    // GET All the BackLogs with Grid filtering Options 
    // ===============================================
    app.get('/api/v1/backlogs', passport.authenticate('basic-login', { session : false }), function(req, res, next) {
        // You need to load each database (here we do it asynchronously)
        db.backlogs.loadDatabase();
        db.backlogs.find({}).sort({insertdate: -1}).exec(function(err, items) {
        	if (err) {
		      console.error(err);
		      res.statusCode = 500;
		      return res.json({ errors: ['Internal Error-Could not retrieve BackLogs'] });
		    }
		    res.statusCode = 200;
            res.json(items);
        });
    });
    // =================================================
    // GET the Certian Backlog with Id
    // =================================================
    app.get('/api/v1/backlogs/:id',passport.authenticate('basic-login', { session : false }), function (req, res, next) {
        var backlogId = req.params.id;
        //console.log(req.parms);
        db.backlogs.loadDatabase();
        db.backlogs.findOne({'_id': backlogId}, function(err, item) {
        	if (err) {
		      console.error(err);
		      res.statusCode = 500;
		      return res.json({ errors: ['Internal Error-Could not retrieve BackLog'] });
		    }
		    // No results returned mean the object is not found
			if (!item) {
				//item is null
			  // We are able to set the HTTP status code on the res object
			  res.statusCode = 404;
			  return res.json({ errors: ['Backlog not found'] });
			}
			res.statusCode = 200;
            res.json(item);
        });
    });
    // =================================================
    // POST to add new backlog
    // =================================================
    app.post('/api/v1/backlogs', passport.authenticate('basic-login', { session : false }), function(req, res, next) {
        if((!(req.body.person) || !(req.body.functionalarea) || !(req.body.idea)) || (req.body.idea =='' || req.body.functionalarea =='' || req.body.person =='')){
            res.statusCode = 400;
			return res.json({
				errors: ['Backlog cannot be created. Person,functionalarea,idea are required.']
			});
        }
        else{
            db.backlogs.insert({
                        person : req.body.person, 
                        functionalarea : req.body.functionalarea, 
                        idea: req.body.idea, 
                        insertdate: new Date() 
                },function(err, item) {
                    if(err)
                    {
                		// We shield our clients from internal errors, but log them
						console.error(err);
						res.statusCode = 500;
						return res.json({
							errors: ['Backlog cannot be created']
						});
                    }
                    else
                    {
                    	// The request created a new resource object
						res.statusCode = 201;
						// The result of CREATE should be the same as GET
						res.json(item);
                    }
            });
        }
    });
    //PATCH - partial  (delta) updates to Backlog
    app.patch('/api/v1/backlogs/:id', passport.authenticate('basic-login', { session : false }) , function(req,res){
        var backlogId = req.params.id;
        var filters = {};
        if(req.body.person)
            filters.person = req.body.person;
        if(req.body.functionalarea)
            filters.functionalarea = req.body.functionalarea;
        if(req.body.idea)
            filters.idea = req.body.idea;
        if(Object.keys(filters).length ==0  || backlogId ==''){
            res.statusCode = 400;
            return res.json({
                errors: ['Backlog cannot be updated. One of the person/functionalarea/idea fields are required.']
            });
        }
        else
        {
            // Set an existing field's value
            db.backlogs.update({ '_id': backlogId}, { $set: filters }, { multi: false }, function (err, numReplaced) {
                if (err) {
                  res.statusCode = 500;
                  return res.json({ errors: ['Internal Error-Could not delete BackLog'] });
                }
                if(numReplaced == 0){
                    res.statusCode = 404;
                    return res.json({ errors: ['Backlog cannot be found to update.'] });
                }
                res.status(200).send("Backlog with Id "+ backlogId +" is updated.");
            });
        }
    });
    // DELETES A backlog
	app.delete('/api/v1/backlogs/:id',passport.authenticate('basic-login', { session : false }), function (req, res) {
		var backlogId = req.params.id;
        //console.log(req.parms);
        //db.backlogs.loadDatabase();
        db.backlogs.remove({ '_id':backlogId}, function (err, numRemoved) {
		  	if (err) {
		      console.error(err);
		      res.statusCode = 500;
		      return res.json({ errors: ['Internal Error-Could not delete BackLog'] });
		    }
            if(numRemoved == 0){
                res.statusCode = 404;
                return res.json({ errors: ['Backlog cannot be found to delete.'] });
            }
		    res.status(200).send("Backlog with Id "+ backlogId +" is deleted.");
		});
	});
};


