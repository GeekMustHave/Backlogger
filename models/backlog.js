"use strict";

// create the model for backlog and expose it to our app

class Backlog {
    constructor (person, functionalarea, idea, insertdate) {
        this.idea = idea;
        this.functionalarea = functionalarea;
        this.person = person;
        this.insertDate = insertdate;
    }
}
module.exports = Backlog;