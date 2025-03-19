import { useEffect, useReducer } from "react";
import "./styles.css";

const initialState = {
  lat: 0,
  lng: 0,
  weather: {},
  weatherToday: [],
  temperatureToday: [],
  country: "",
  city: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "fetchedLocation":
      return {
        ...state,
        lat: action.payload.coords.latitude,
        lng: action.payload.coords.longitude,
      };
    case "fetchedWeatherDetails":
      return {
        ...state,
        weather: action.payload,
        weatherToday: action.payload?.hourly?.time?.slice(0, 24),
        temperatureToday: action.payload?.hourly?.temperature_2m?.slice(0, 24),
      };
    case "fetchedCity":
      return {
        ...state,
        country: action.payload?.countryName,
        city: action.payload?.city,
      };
    default:
      return state;
  }
}

export default function App() {
  const [
    { lat, lng, weatherToday, temperatureToday, city, country },
    dispatch,
  ] = useReducer(reducer, initialState);

  useEffect(() => {
    async function getWeatherDetails() {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m`
        );
        const data = await res.json();
        dispatch({ type: "fetchedWeatherDetails", payload: data });
      } catch (err) {
        console.error(err);
      }
    }
    if (lat !== 0 && lng !== 0) {
      getWeatherDetails();
    }
  }, [lat, lng]);

  useEffect(
    function () {
      async function getLocation() {
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}`
          );
          const data = await res.json();
          console.log(data);
          dispatch({ type: "fetchedCity", payload: data });
        } catch (err) {
          console.log("Couldn't get city");
        }
      }

      if (lat !== 0 && lng !== 0) {
        getLocation();
      }
    },
    [lat, lng]
  );

  function fetchWeather() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, error);
    } else {
      console.log("Geolocation not supported");
    }

    function success(position) {
      dispatch({ type: "fetchedLocation", payload: position });
    }

    function error() {
      console.log("Unable to retrieve your location");
    }
  }

  return (
    <div className="app-container">
      <h1 className="title">Weather Application</h1>
      <p className="location">
        Latitude: {lat} | Longitude: {lng}
      </p>
      <p className="location">
        City: {city}| Country: {country}
      </p>
      <button onClick={fetchWeather} className="fetch-button">
        Fetch Weather
      </button>
      {weatherToday.map((time, index) => (
        <>
          <p key={`time-${index}`} className="time">
            {time.slice(11)}
          </p>
          <p key={`temp-${index}`} className="temperature">
            {temperatureToday[index]}°
          </p>
        </>
      ))}
    </div>
  );
}
