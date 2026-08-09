const apiKeY = '7305b3664805e05c76a4eef151039948';
const apiUrl = 'https://api.openweathermap.org/data/2.5/weather?units=metric';

const searchBar = document.querySelector('.search input');
const searchButton = document.querySelector('.search button');
const weatherIcon = document.querySelector('.weather-icon');

async function checkWeather(city) {
    // Guard against empty input so we don't send a pointless request
    if (!city.trim()) {
        //console.log("City field is empty, skipping fetch.");
        return;
    }

    const reponse = await fetch(`${apiUrl}&q=${encodeURIComponent(city)}&appid=${apiKeY}`);
    let data = await reponse.json();

    //console.log(data);

    // OpenWeatherMap returns cod: 200 on success.
    // On failure (e.g. unknown city, bad API key) it returns cod: 404 or 401
    // along with a "message" field explaining what went wrong.
    if (data.cod !== 200) {
        // Show the API's own error message to the user instead of crashing
        // when we try to read properties that don't exist (like data.main).
        document.querySelector('.city').innerHTML = "City not found";
        document.querySelector('.temp').innerHTML = "";
        document.querySelector('.humidity').innerHTML = "";
        document.querySelector('.wind').innerHTML = "";
        console.log("Weather API error:", data.message);
        return; // Stop here, nothing else to update
    }

    document.querySelector('.city').innerHTML = data.name;
    document.querySelector('.temp').innerHTML = Math.floor(data.main.temp).toFixed(0) + "°C";
    document.querySelector('.humidity').innerHTML = data.main.humidity + "%";
    document.querySelector('.wind').innerHTML = data.wind.speed + "km/h";

    if(data.weather[0].main == "Clouds"){
        weatherIcon.src ="Images/clouds.png";

    }
   else if(data.weather[0].main == "Clouds"){
        weatherIcon.src ="Images/clouds.png";

    }
   else if(data.weather[0].main == "Clear"){
        weatherIcon.src ="Images/clear.png";

    }
   else if(data.weather[0].main == "Rain"){
        weatherIcon.src ="Images/rain.png";

    }
   else if(data.weather[0].main == "Drizzle"){
        weatherIcon.src ="Images/drizzle.png";

    }
   else if(data.weather[0].main == "Snow"){
        weatherIcon.src ="Images/snow.png";

    }
   else if(data.weather[0].main == "Mist"){
        weatherIcon.src ="Images/mist.png";

    }

    document.querySelector('.weather').style.display = "block";
    
}

searchButton.addEventListener('click', () => {
    checkWeather(searchBar.value);
});