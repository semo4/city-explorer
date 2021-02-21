'use strict';


// reqiure statment import packge 
let express = require('express');
const cors = require('cors');

// init and config
let app = express();
app.use(cors());

// for .env file 
require('dotenv').config();
// gor var from .env
const PORT = process.env.PORT;


// route - end point 

app.get('/location', handleLocation);

function handleLocation(req, res){
    let searchQuery = req.query.city;
    let locationObject = grtLoocationData(searchQuery);
    res.status(200).send(locationObject);

    
}
// handle data
function grtLoocationData(searchQuery){
    // get data array from json 
    let locationData = require('./data/location.json'); 
    // get value from array 
    let longitude = locationData[0].lon;
    let latitude = locationData[0].lat;
    let displayName = locationData[0].display_name;

    let responseObject = new CityLocation(searchQuery, displayName, latitude, longitude);
    return responseObject;
}


// constructors 

function CityLocation(searchQuery, displayName, lat, lon){
    this.search_query = searchQuery;
    this.formatted_query = displayName;
    this.latitude = lat;
    this.longitude = lon;
}

app.listen(PORT, ()=>{
    console.log('the app is listening to '+ PORT);
});


