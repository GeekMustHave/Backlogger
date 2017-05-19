"use strict";

module.exports = function(app, passport) {

    //app.use('/api/v1', require('api_v1.js')(app,passport));

	// =====================================
    // HOME PAGE (with Logout links) ========
    // =====================================
    app.get('/', isLoggedIn, function(req, res, next) {
        // load the index.ejs file
        res.render('index', { 
        						title: req.app.locals.AppTitle, 
        						pageTitle: req.app.locals.ProjectTitle,
        						user : req.user
        						// get the user out of session and pass to template  
        					});
    });
    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('account/login.ejs', { 
        	message: req.flash('loginMessage'),
        	appTitle: app.locals.AppTitle 
        }); 
    });

    app.post('/login', function(req, res, next) {
    	//console.log(req);
    	if(req.body.password){
    		return next(); 
    	}
    	// render the page and pass in any flash data if it exists
        res.render('account/login', { 
        	message: 'Please use your secrect key.' ,
        	appTitle: app.locals.AppTitle
        }); 
    },
    passport.authenticate('local-login', {
        successRedirect : '/', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // process the login form
    // app.post('/login', passport.authenticate('local-login', {
    //     successRedirect : '/', // redirect to the secure profile section
    //     failureRedirect : '/login', // redirect back to the signup page if there is an error
    //     failureFlash : true // allow flash messages
    // }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // comment out for now
    // app.get('/signup', function(req, res) {
    //     // render the page and pass in any flash data if it exists
    //     res.render('account/signup.ejs', { message: req.flash('signupMessage') });
    // });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    	}
    ));


    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('account/profile.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
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
