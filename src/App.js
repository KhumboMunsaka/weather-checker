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
  isLoading: false,
  error: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return { ...state, isLoading: true, error: "" };
    case "fetchedLocation":
      return {
        ...state,
        lat: action.payload.coords.latitude,
        lng: action.payload.coords.longitude,
      };
    case "fetchedWeatherDetails":
      return {
        ...state,
        isLoading: false,
        weather: action.payload,
        weatherToday: action.payload?.hourly?.time?.slice(0, 24) || [],
        temperatureToday:
          action.payload?.hourly?.temperature_2m?.slice(0, 24) || [],
        probabilityToday:
          action.payload?.hourly?.precipitation_probability?.slice(0, 24) || [],
      };
    case "fetchedCity":
      return {
        ...state,
        country: action.payload?.countryName,
        city:
          action.payload?.city ||
          action.payload?.locality ||
          "Unknown Location",
      };
    case "error":
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
}

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "numeric", hour12: true });
}

function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function App() {
  const [
    {
      lat,
      lng,
      weatherToday,
      temperatureToday,
      probabilityToday,
      city,
      country,
      isLoading,
      error,
    },
    dispatch,
  ] = useReducer(reducer, initialState);

  useEffect(() => {
    async function getWeatherDetails() {
      if (lat === 0 || lng === 0) return;

      dispatch({ type: "loading" });
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,precipitation_probability`
        );
        if (!res.ok) throw new Error("Failed to fetch weather data");
        const data = await res.json();
        console.log(data);

        dispatch({ type: "fetchedWeatherDetails", payload: data });
      } catch (err) {
        dispatch({ type: "error", payload: err.message });
      }
    }
    getWeatherDetails();
  }, [lat, lng]);

  useEffect(() => {
    async function getLocation() {
      if (lat === 0 || lng === 0) return;

      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}`
        );
        if (!res.ok) throw new Error("Failed to fetch location name");
        const data = await res.json();

        dispatch({ type: "fetchedCity", payload: data });
      } catch (err) {
        // Non-critical, just log
        console.error("Couldn't get city name", err);
      }
    }
    getLocation();
  }, [lat, lng]);

  function fetchWeather() {
    dispatch({ type: "loading" });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          dispatch({ type: "fetchedLocation", payload: position });
        },
        (err) => {
          dispatch({
            type: "error",
            payload: "Unable to retrieve your location. Please allow access.",
          });
        }
      );
    } else {
      dispatch({
        type: "error",
        payload: "Geolocation not supported by your browser",
      });
    }
  }

  // Calculate current temp (first item if available)
  const currentTemp = temperatureToday.length > 0 ? temperatureToday[0] : null;
  const currentDesc = "Clear Sky"; // Placeholder as API doesn't give simple desc easily in this endpoint without more parsing

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="logo">WeatherCheck</h1>
      </header>

      <main className="main-content">
        {!city && !isLoading && !error && (
          <div className="welcome-card">
            <h2>Check local weather</h2>
            <p>Get today's weather for your current location instantly.</p>
            <button onClick={fetchWeather} className="btn-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
              </svg>
              Locate Me
            </button>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <p>⚠️ {error}</p>
            <button onClick={fetchWeather} className="btn-retry">
              Try Again
            </button>
          </div>
        )}

        {isLoading && (
          <div className="loader-container">
            <div className="spinner"></div>
            <p>Fetching forecast...</p>
          </div>
        )}

        {city && !isLoading && (
          <div className="weather-dashboard">
            <section className="current-weather">
              <div className="location-badge">
                <span className="city-name">{city}</span>
                <span className="country-name">{country}</span>
              </div>

              <div className="temp-hero">
                <span className="hero-val">{currentTemp}</span>
                <span className="hero-unit">°C</span>
              </div>
              <div className="date-display">{formatDate(weatherToday[0])}</div>
            </section>

            <section className="forecast-section">
              <h3>Hourly Forecast</h3>
              <div className="forecast-grid">
                {weatherToday.map((time, index) => (
                  <div key={index} className="forecast-card">
                    <span className="f-time">{formatTime(time)}</span>
                    <div className="precip-container">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="precip-icon"
                      >
                        <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" />
                      </svg>
                      <span className="precip-text">
                        {probabilityToday[index]}%
                      </span>
                    </div>
                    <span className="f-temp">{temperatureToday[index]}°</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Built with React & Open-Meteo</p>
      </footer>
    </div>
  );
}
