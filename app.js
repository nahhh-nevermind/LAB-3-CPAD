const search = document.getElementById("searchinput")
const button = document.querySelector("button")
const retry = document.getElementById("retry")
const weatherCodes = {
    0: { desc: "Clear Sky", icon: "☀️" },
    1: { desc: "Mainly Clear", icon: "🌤️" },
    2: { desc: "Partly Cloudy", icon: "⛅" },
    3: { desc: "Overcast", icon: "☁️" }
}

button.addEventListener("click", async () => {
    const city = search.value;
    if (city) {
        await weatherData(city);
    }
});

async function weatherData(city){
    let timezone;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    retry.style.display = "none";
    document.getElementById("time").textContent = "";

    const pulseTargets = ["city", "temp", "weather", "humidity", "wind", "time"];
    pulseTargets.forEach(id => document.getElementById(id).classList.add("skeleton"));

    document.querySelectorAll("#forecast div").forEach(el => el.classList.add("skeleton"));

    try {
        const geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${city}`;
        const geoResponse = await fetch(geoURL, {signal: controller.signal});
        const geoData = await geoResponse.json();

        if (!geoData.results) {
            alert("City not found !");
            clearTimeout(timeoutId);
            return;
        }

        const res = geoData.results[0];
        const { latitude, longitude, name } = res;
        timezone = res.timezone || "UTC";

        const currWeatherURL = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
        const currWeatherResponse = await fetch(currWeatherURL, {signal: controller.signal});
        const currWeatherData = await currWeatherResponse.json();

        updateUI(currWeatherData, name)
        clearTimeout(timeoutId);
    } catch (error) {
        const retryDiv = document.getElementById("retry");
        retry.style.display = "block";

        if(error.name === 'AbortError'){
            console.error("Request timed out after 10 seconds");
            retry.textContent = "Request timed out. Please try again "
        } else {
            console.error("Fetch failed:", error);
            retryDiv.textContent = "Network Error. Click here to retry.";
        }

        document.querySelectorAll(".skeleton").forEach(el => el.classList.remove("skeleton"));
    }

    if (timezone) {
        LocalTime(timezone);
    }
}

retry.addEventListener("click", () => {
    document.getElementById("retry").style.display = "none";

    const city = search.value;
    weatherData(city);
});

function updateUI(wData, name){
    const data = wData.current_weather;
    const lookup = weatherCodes[data.weathercode] || { desc: "Unknown", icon: "❓" };

    const city = document.getElementById("city");
    city.textContent = name;
    city.classList.remove("skeleton");

    const temp = document.getElementById("temp");
    temp.textContent = `${data.temperature}°C`;
    temp.classList.remove("skeleton");

    const weather = document.getElementById("weather");
    weather.textContent = `${lookup.icon} ${lookup.desc}`;
    weather.classList.remove("skeleton");

    const humid = document.getElementById("humidity");
    humid.textContent = `Humidity: ${wData.hourly.relativehumidity_2m[0]}%`;
    humid.classList.remove("skeleton");

    const wind = document.getElementById("wind");
    wind.textContent = `Wind: ${data.windspeed} km/h`;
    wind.classList.remove("skeleton");

    const dayIDs = ["mon", "tues", "wednes", "thurs", "fri", "satur", "sun"];
    dayIDs.forEach((id, i) => {
        const card = document.getElementById(id);
        const dayCode = wData.daily.weathercode[i];
        const dayLookup = weatherCodes[dayCode] || { icon: "☀️" };

        card.querySelector(".weathericon").textContent = dayLookup.icon;
        card.querySelector(".hightemp").textContent = `High: ${wData.daily.temperature_2m_max[i]}°C`;
        card.querySelector(".lowtemp").textContent = `Low: ${wData.daily.temperature_2m_min[i]}°C`;

        card.classList.remove("skeleton");
    });
}

async function LocalTime(timezone){

    $.ajax({
        url: `https://worldtimeapi.org/api/timezone/${timezone}`,
        dataType: 'json',
        timeout: 5000,
    })
    .done(function(t){
        const timeString = t.datetime.split("T")[1].substring(0, 5);;
        $("#time").text(`Local Time : ${cleanTime} (${timezone})`);
        $("#time").removeClass("skeleton");
        
    })
    .fail(function(jqXHR, textStatus){
        const now = new Date();
        const browsertime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        $("#time").text(`Browser Local Time : ${browsertime}`);
        $("#time").removeClass("skeleton");

        if(textStatus === "timeout"){
            console.log("Time API timed out");
        }
    })
    .always(function(){
        console.log("Time Request Finished : " + new Date().toISOString());
    })
}