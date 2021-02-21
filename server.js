'use strict';


// reqiure statment import packge 
let express = require('express');

// init and config
let app = express();
// for .env file 
require('dotenv').config();
// gor var from .env
const PORT = process.env.PORT;


app.listen(PORT, ()=>{
    console.log('the app is listening to '+ PORT);
});


