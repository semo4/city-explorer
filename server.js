'use strict';


// reqiure statment import packge 
let express = require('express');

// init and config
let app = express();

// for .env file 
require('dotenv').config();

const cors = require('cors');

const superagent = require('superagent');

app.use(cors());

let pg = require('pg');

// const client = new pg.Client( process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });

// gor var from .env
const PORT = process.env.PORT;


// route - end point 
app.get('/location', handleLocation);
app.get('/weather', handleWeather);
app.get('/parks', handleparks);


// handle 
function handleLocation(req, res) {
    try {
        let searchQuery = req.query.city;
        grtLoocationData(searchQuery, res);

    } catch (error) {
        res.status(500).send('Sorry, something went wron' + error);
    }
}

function handleWeather(req, res) {
    try {
        let searchQuery = req.query.search_query;
        let longitude = req.query.longitude;
        let latitude = req.query.latitude;
        grtWeatherData(searchQuery, longitude, latitude, res);
        // res.status(200).send(weatherObject); 
    } catch (error) {
        res.status(500).send('Sorry, something went wron' + error);
    }

}

function handleparks(req, res) {
    try {
        let searchQuery = req.query.search_query;
        getParksData(searchQuery, res);

    } catch (error) {
        res.status(500).send('Sorry, something went wron' + error);
    }
}


function checkExist(searchQuery, res) {

    let sqlQuery = "SELECT * FROM citylocation WHERE c_name = ($1) ";
    let value = [searchQuery];
    client.query(sqlQuery, value).then(data => {
        // console.log('data returned back from db in check function ', data.rows[0].c_name);
        
        if (data.rows.length === 0){
            const query = {
                key: process.env.GEOCODE_API_KEY,
                q: searchQuery,
                limit: 1,
                format: 'json'
            }
            
    
            let url = `https://us1.locationiq.com/v1/search.php`;
            superagent.get(url).query(query).then(data => {
                // console.log(data.body[0].lat);
                try {
                    let longitude = data.body[0].lon;
                    let latitude = data.body[0].lat;
                    let displayName = data.body[0].display_name;
                    let sqlQuery = `insert into citylocation(c_name,display_name, lat, lon) values ($1,$2,$3,$4)returning *`;
                    let value = [searchQuery,displayName,latitude,longitude]; 
                    client.query(sqlQuery,value).then(data =>{
                        console.log('data returned back from db ' ,data);
                    });
                    let responseObject = new CityLocation(searchQuery, displayName, latitude, longitude);
                    res.status(200).send(responseObject);
                } catch (error) {
                    res.status(500).send(error);
                }
    
            }).catch(error => {
                res.status(500).send("Cannot connect with the api " + error);
    
            });
        }
        else{
            let responseObject = new CityLocation(data.rows[0].c_name, data.rows[0].display_name, data.rows[0].lat, data.rows[0].lon);
            res.status(200).send(responseObject);
        }
        
    }).catch(error => {
        console.log('canoot data returned back from db in check function ', error);
    });
}



function grtLoocationData(searchQuery, res) {

    checkExist(searchQuery, res);

    
}

function grtWeatherData(searchQuery, longitude, latitude, res) {

    // get data array from json 

    const query = {
        city: searchQuery,
        lat: latitude,
        lon: longitude,
        key: process.env.WEATHER_API_KEY,
        days: 8
    }

    let url = `https://api.weatherbit.io/v2.0/forecast/daily`;

    superagent.get(url).query(query).then(data => {
        try {
            let obj = JSON.parse(data.text);

            let weatherArray = [];
            for (let i = 0; i < obj.data.length; i++) {
                let weatherDesc = obj.data[i].weather['description'];
                let time = obj.data[i].datetime;
                time = time.replace("-", "/");
                var date = new Date(time);
                let dateStr = date.toString();
                var newDate = dateStr.slice(" ", 16);

                // return {'city':searchQuery,'weather':weatherDesc, 'time':date.toString()}
                let responseObject = new CityWeather(weatherDesc, newDate);
                weatherArray.push(responseObject);
            }
            res.status(200).send(weatherArray);
            // console.log(data.data);
        } catch (error) {
            res.status(500).send(error);
        }


    }).catch(error => {
        res.status(500).send("Cannot connect with the api " + error);

    });
}

function getParksData(searchQuery, res) {

    // get data array from json 

    const query = {
        q: searchQuery,
        api_key: process.env.PARKS_API_KEY
    }

    let url = `https://developer.nps.gov/api/v1/parks`;

    superagent.get(url).query(query).then(data => {
        try {
            let obj = data.body.data;

            let parksArray = [];
            for (let i = 0; i < obj.length; i++) {
                let name = obj[i].fullName;
                let description = obj[i].description;
                let url = obj[i].url;
                let fee = obj[i].entranceFees[0].cost;
                let address = `" ${obj[i].addresses[0].line1} " "${obj[i].addresses[0].city}" " ${obj[i].addresses[0].stateCode}" "${obj[i].addresses[0].postalCode}" `;
                let responseObject = new CityParks(name, address, fee, description, url);
                parksArray.push(responseObject);



            }
            res.status(200).send(parksArray);
            // res.status(200).send(data.body.data); 


        } catch (error) {
            res.status(500).send("error in api " + error);
        }

    }).catch(error => {
        res.status(500).send("Cannot connect with the api " + error);

    });
}





// constructors 
function CityLocation(searchQuery, displayName, lat, lon) {
    this.search_query = searchQuery;
    this.formatted_query = displayName;
    this.latitude = lat;
    this.longitude = lon;
}


// constructors 
function CityWeather(weatherDesc, time) {
    this.forecast = weatherDesc;
    this.time = time;
}

// function getParksData(searchQuery, res) {
//     let query = {
//       q: searchQuery,
//       api_key: process.env.PARKS_API_KEY
//     };
//     let url = "https://developer.nps.gov/api/v1a/parks";
//     superagent.get(url).query(query).then((data) => {
//       try {
//         let arrayOfObjects = [];
//         data.body.data.forEach(value => {
//           let name = value.fullName;
//           let address = value.addresses[0].line1 + " " + value.addresses[0].city + " " + value.addresses[0].stateCode + " " + value.addresses[0].postalCode;
//         //   let fee = value.entranceFees[0].cost;
//           let description = value.description;
//           let url = value.url;
//           let responseObject = new CityParks(name, address,  description, url);
//           arrayOfObjects.push(responseObject);
//         });
//         res.status(200).send(arrayOfObjects);
//       } catch(error){
//         res.status(500).send("Sorry, something went wrong");
//       }
//     }).catch((error) => {
//       res.status(500).send("Sorry, something went wrong from promise" + error);
//     });
//   } 

function CityParks(name, address, fee, description, url) {
    this.name = name;
    this.address = address;
    this.fee = fee;
    this.description = description;
    this.url = url;
}

client.connect().then(data => {
    app.listen(PORT, () => {
        console.log('the app is listening to ' + PORT);
    });
}).catch(error => {
    console.log('error in connect to database ' + error);
});



