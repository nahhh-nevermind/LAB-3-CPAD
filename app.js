const searchinput = document.getElementById("searchinput");
const button = document.querySelector("button");
const temp = document.getElementById("temp");
const cityName = document.getElementById("city")

button.addEventListener("click", async () => {
    const cityname = searchinput.value;

    try {
        await getWeatherData(cityname);
    } catch (error) {
        console.error("Network error: ", error);
    }
})

async function getWeatherData(city) {
    try {
        const geourl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}`;
        const georesponse = await fetch(geourl);
        const geodata = await georesponse.json();

        if (!geodata.results) {
            alert("City not found")
            return;
        }

        const { latitude, longitude, name } = geodata.results[0];

        const currWeather = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`
        const currResponse = await fetch(currWeather);
        const weatherData = await currResponse.json();
        console.log(weatherData);

        updateUI(weatherData, name);
        
        temp.textContent = `${weatherData.current_weather.temperature}°C`
        temp.classList.remove("skeleton");

        cityName.textContent = name;
        cityName.classList.remove("skeleton");
    } catch (error) {
        console.log("Failed to load Weather Data: ", error);
    }
}

const weatherCodes = {
    0: { desc: "Clear Sky", icon: "☀️" },
    1: { desc: "Mainly Clear", icon: "🌤️" },
    2: { desc: "Partly Cloudy", icon: "⛅" },
    3: { desc: "Overcast", icon: "☁️" },
    45: { desc: "Fog", icon: "🌫️" },
    51: { desc: "Drizzle", icon: "🌧️" },
    61: { desc: "Rain", icon: "🌧️" },
    71: { desc: "Snow", icon: "❄️" },
    95: { desc: "Thunderstorm", icon: "⛈️" }
}