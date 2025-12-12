const mongoose = require('mongoose');
const { DB_CONNECTION_STRING } = require("../config");

module.exports = function () {
    console.log("Connecting to:", DB_CONNECTION_STRING); // debug
    console.log("Length:", DB_CONNECTION_STRING.length);
    console.log(DB_CONNECTION_STRING.split("").map(c => c.charCodeAt(0)));

    mongoose.connect(DB_CONNECTION_STRING) // just pass the URI
        .then(() => console.log("MongoDB Connected"))
        .catch(err => console.error("MongoDB connection error:", err));
};