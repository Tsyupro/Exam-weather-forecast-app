
const apiKey = '437b134d4dbd0256009f5e4c54fd7b4a';
let nameCity ="";
const weatherTranslations = {
    'clear sky': 'чисте небо',
    'few clouds': 'кілька хмар',
    'scattered clouds': 'розсіяні хмари',
    'broken clouds': 'розбите хмари',
    'overcast clouds': 'хмарно',
    'mist': 'туман',
    'light rain': 'невеликий дощ',
    'moderate rain': 'уміренний дощ',
    'heavy rain': 'сильний дощ',
};

function translateWeatherStatus(englishStatus) {
    return weatherTranslations[englishStatus] || englishStatus;
}

async function getWeatherByCoords(latitude, longitude) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const weatherData = await getWeatherByCoords(latitude, longitude);
            updateWeather(weatherData);
            getWeatherDays(weatherData.name);
            nameCity=weatherData.name;
            getHourlyForecast(latitude, longitude);
            updateCityWeather('Kyiv', 50.4501, 30.5234);
            updateCityWeather('Odesa', 46.4825, 30.7233);
            updateCityWeather('Dnipro', 48.4647, 35.0462);
        }, (error) => {
            console.error('Error getting location:', error);
  
            updateWeatherName('Kalush');
        });
    } else {
        console.error('Geolocation is not supported by this browser.');
   
        updateWeatherName('Kalush');
    }
}
async function updateCityWeatherBySearch(cityName) {
    const cityCardContainer = document.querySelector('#cityForecast');

    if (cityCardContainer) {
        const coordinates = await getCoordinatesByCityName(cityName);
        if (coordinates) {
            const { latitude, longitude } = coordinates;
            const weatherData = await getWeatherByCoords(latitude, longitude);
            const temperature = Math.round(weatherData.main.temp);
            const weatherIcon = getWeatherIcon(weatherData.weather[0].icon);

            const cityCard = createCityCard(cityName, temperature, weatherIcon);
            cityCardContainer.innerHTML = '';
            cityCardContainer.appendChild(cityCard);
            getHourlyForecast(latitude, longitude);
        } else {
            console.error(`Could not find coordinates for the city: ${cityName}`);
        }
    }
}


async function getCoordinatesByCityName(cityName) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&units=metric&appid=${apiKey}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (response.ok) {
            const coordinates = {
                latitude: data.coord.lat,
                longitude: data.coord.lon
            };
            return coordinates;
        } else {
            console.error(`Error fetching coordinates for ${cityName}: ${data.message}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching coordinates for ${cityName}:`, error);
        return null;
    }
}


async function getWeatherByCityName(cityName) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=metric&appid=${apiKey}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (response.ok) {
            return data;
        } else {
            throw new Error(data.message || 'Failed to fetch weather data');
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
}

async function updateCityWeather(city, latitude, longitude) {
    const cityCardContainer = document.querySelector('.city-forecast');

    if (cityCardContainer) {
        const weatherData = await getWeatherByCoords(latitude, longitude);
        const temperature = Math.round(weatherData.main.temp);
        const weatherIcon = getWeatherIcon(weatherData.weather[0].icon);

        const cityCard = createCityCard(city, temperature, weatherIcon);
        cityCardContainer.appendChild(cityCard);
    }
}



function createCityCard(city, temperature, weatherIcon) {
    const cityCard = document.createElement('div');
    cityCard.className = 'city-card';
    cityCard.setAttribute('data-city', city);
    cityCard.innerHTML = `
        <div class="icon">${weatherIcon}</div>
        <h3>${city}</h3>
        <p class="temperature">${temperature}°C</p>
    `;
    return cityCard;
}

function updateWeather(weatherData) {

    document.querySelector('h1').textContent = weatherData.name;
    document.querySelector('.icon').innerHTML = getWeatherIcon(weatherData.weather[0].icon);
    document.querySelector('.description').textContent = translateWeatherStatus(weatherData.weather[0].description);
    document.querySelector('.temperature').textContent = `${Math.round(weatherData.main.temp)}°C`;
    document.querySelector('.feels-like').textContent = `Відчувається як: ${Math.round(weatherData.main.feels_like)}°C`;
    document.querySelector('.wind').textContent = `Вітер: ${weatherData.wind.speed} км/г, ${getWindDirection(weatherData.wind.deg)}`;

    const sunriseTime = new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sunsetTime = new Date(weatherData.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    document.querySelector('.sunrise').textContent = `Світанок: ${sunriseTime}`;
    document.querySelector('.sunset').textContent = `Захід сонця: ${sunsetTime}`;

    const daylightDuration = (weatherData.sys.sunset - weatherData.sys.sunrise) / 3600;
    document.querySelector('.day-duration').textContent = `Тривалість дня: ${daylightDuration.toFixed(2)} годин`;

    const currentDate = new Date();
    const dateFormatted = `${currentDate.getDate()}.${currentDate.getMonth() + 1}.${currentDate.getFullYear()}`;
    document.querySelector('.date').textContent = `Дата: ${dateFormatted}`;
}

function getWindDirection(degrees) {
    const directions = ['Північний', 'Північно-східний', 'Східний', 'Південно-східний', 'Південний', 'Південно-західний', 'Західний', 'Північно-західний'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

async function getHourlyForecast(latitude, longitude) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        const hourlyForecastContainer = document.querySelector('.hourly-forecast');
        hourlyForecastContainer.innerHTML = '';

        const currentDate = new Date();
        const currentDay = currentDate.getDate();


        const selectedHours = [2, 5, 8, 11, 14, 17, 20, 23];

  
        const filteredData = data.list.filter(item => {
            const forecastDate = new Date(item.dt * 1000);
            return forecastDate.getDate() === currentDay && selectedHours.includes(forecastDate.getHours());
        });

        filteredData.forEach(item => {
            const forecastDate = new Date(item.dt * 1000);
            const time = forecastDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const icon = item.weather[0].icon;
            const description = translateWeatherStatus(item.weather[0].description);
            const temperature = Math.round(item.main.temp);
            const feelsLike = Math.round(item.main.feels_like);
            const windSpeed = item.wind.speed;
            const windDirection = getWindDirection(item.wind.deg);

            const weatherCard = document.createElement('div');
            weatherCard.className = 'weather-card';
            weatherCard.innerHTML = `
                <div class="icon">${getWeatherIcon(icon)}</div>
                <h3>${time}</h3>
                <p class="description">${description}</p>
                <p class="temperature">${temperature}°C</p>
                <p class="feels-like">Відчувається як: ${feelsLike}°C</p>
                <p class="wind">Вітер: ${windSpeed} км/г, ${windDirection}</p>
            `;

            hourlyForecastContainer.appendChild(weatherCard);
        });
    } catch (error) {
        console.error('Error fetching hourly forecast:', error);
    }
}

function getWeatherIcon(iconCode) {
    return `<img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="Weather Icon">`;
}


async function updateWeatherName(cityName) {
    const coordinates = await getCoordinatesByCityName(cityName);
    const { latitude, longitude } = coordinates;
    const weatherData = await getWeatherByCoords(latitude, longitude);
    updateWeather(weatherData);
}

const inputElement = document.querySelector('#Search'); 

inputElement.addEventListener('keydown', async function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();

        const nameCity = event.target.value;

        try {
            const cityExists = await checkCityExistence(apiKey, nameCity);

            if (cityExists) {
                isNotError();
                updateWeatherName(nameCity);
                getWeatherDays(nameCity);
            } else {
                showError();
            }
        } catch (error) {
            console.error(`Помилка при перевірці міста: ${error.message}`);
        }
    }
});


function showError() {
    const todayElement = document.querySelector('.Today');
const daysElement = document.querySelector('.classhandle5DaysClick');
const errorMeesage = document.querySelector('.containerError');

daysElement.style.display = 'none';
todayElement.style.display = 'none';
errorMeesage.style.display = 'block';
}

function isNotError(){
    const todayElement = document.querySelector('.Today');
    const errorMeesage = document.querySelector('.containerError');
    const daysElement = document.querySelector('.classhandle5DaysClick');

    daysElement.style.display = 'none';
    todayElement.style.display = 'block';
    errorMeesage.style.display = 'none';
}




function getWeatherDays(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const weatherContainer = document.getElementById('weatherContainertwo');
            weatherContainer.innerHTML = ''; 

            for (let i = 0; i < data.list.length; i += 8) {
                const weatherData = data.list[i];
                const date = new Date(weatherData.dt * 1000);
                const dayOfWeek = new Intl.DateTimeFormat('uk-UA', { weekday: 'long' }).format(date);
                const iconUrl = `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`;

                const temperatureCelsius = Math.round(weatherData.main.temp - 273.15);

                const weatherCard = document.createElement('div');
                weatherCard.classList.add('weather-cardtwo');

                weatherCard.innerHTML = `
                    <h3>${dayOfWeek}</h3>
                    <img src="${iconUrl}" alt="${weatherData.weather[0].description}">
                    <p>Температура: ${temperatureCelsius} &#8451;</p>
                    <p>Вологість: ${weatherData.main.humidity}%</p>
                    <p>Швидкість вітру: ${weatherData.wind.speed} m/s</p>
                `;

                weatherContainer.appendChild(weatherCard);
            }
        })
        .catch(error => console.error('Error fetching weather data:', error));
}


function handleTodayClick() {
    const todayElement = document.querySelector('.Today');
const daysElement = document.querySelector('.classhandle5DaysClick');
const errorMeesage = document.querySelector('.containerError');


errorMeesage.style.display = 'none';
daysElement.style.display = 'none';
todayElement.style.display = 'block';
}

function handle5DaysClick() {
const errorMeesage = document.querySelector('.containerError');
const todayElement = document.querySelector('.Today');
const daysElement = document.querySelector('.classhandle5DaysClick');

errorMeesage.style.display = 'none';
daysElement.style.display = 'block';
todayElement.style.display = 'none';

   
}

async function checkCityExistence(apiKey, cityName) {
    const apiUrl = "http://api.openweathermap.org/data/2.5/weather";
    const queryParams = `?q=${cityName}&appid=${apiKey}`;
  
    try {
      const response = await fetch(apiUrl + queryParams);
      const data = await response.json();
  
      if (data.name) {
        console.log(`Місто ${cityName} існує.`);
        return true;
      } else {
        console.log(`Місто ${cityName} не знайдено.`);
        return false;
      }
    } catch (error) {
      console.error(`Помилка запиту: ${error.message}`);
      return false;
    }
  }
  

window.addEventListener('load', getLocation);

