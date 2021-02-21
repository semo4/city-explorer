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





app.get('/weather', handleWeather);




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





function handleWeather(req, res){
    let searchQuery = req.query.city;
    let weatherObject = grtWeatherData(searchQuery);
    res.status(200).send(weatherObject); 
}
// handle data
function grtWeatherData(searchQuery){
    // get data array from json 
    let weatherData = require('./data/weather.json'); 
    // get value from array 
    let weatherArray = [];
    for(let i = 0 ; i <weatherData.data.length; i++ ){
        let weatherDesc = weatherData.data[i].weather['description'];
        let time = weatherData.data[i].datetime;
        time = time.replace("-","/");
        var date = new Date(time);
        let dateStr = date.toString();
        var newDate = dateStr.slice(" ",16);
        
        // return {'city':searchQuery,'weather':weatherDesc, 'time':date.toString()}
        let responseObject = new CityWeather(weatherDesc, newDate);
        weatherArray.push(responseObject);
    }
    return weatherArray;  
}


// constructors 

function CityWeather(weatherDesc, time){
    this.forecast = weatherDesc;
    this.time = time;
}




app.listen(PORT, ()=>{
    console.log('the app is listening to '+ PORT);
});


