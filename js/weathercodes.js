// WMO weather-code lookup (Open-Meteo uses WMO codes). Maps a code to a
// short label and an icon key; the icon key will select a Meteocons SVG
// once the weather-icons checkpoint integrates real art - for now it
// also drives the placeholder badge text.

const CODES = {
  0: { label: "Clear", icon: "clear" },
  1: { label: "Mostly clear", icon: "clear" },
  2: { label: "Partly cloudy", icon: "partly-cloudy" },
  3: { label: "Overcast", icon: "cloudy" },
  45: { label: "Fog", icon: "fog" },
  48: { label: "Fog", icon: "fog" },
  51: { label: "Light drizzle", icon: "rain" },
  53: { label: "Drizzle", icon: "rain" },
  55: { label: "Heavy drizzle", icon: "rain" },
  56: { label: "Freezing drizzle", icon: "rain" },
  57: { label: "Freezing drizzle", icon: "rain" },
  61: { label: "Light rain", icon: "rain" },
  63: { label: "Rain", icon: "rain" },
  65: { label: "Heavy rain", icon: "rain" },
  66: { label: "Freezing rain", icon: "rain" },
  67: { label: "Freezing rain", icon: "rain" },
  71: { label: "Light snow", icon: "snow" },
  73: { label: "Snow", icon: "snow" },
  75: { label: "Heavy snow", icon: "snow" },
  77: { label: "Snow grains", icon: "snow" },
  80: { label: "Rain showers", icon: "rain" },
  81: { label: "Rain showers", icon: "rain" },
  82: { label: "Heavy showers", icon: "rain" },
  85: { label: "Snow showers", icon: "snow" },
  86: { label: "Snow showers", icon: "snow" },
  95: { label: "Thunderstorm", icon: "thunderstorm" },
  96: { label: "Thunderstorm", icon: "thunderstorm" },
  99: { label: "Thunderstorm", icon: "thunderstorm" },
};

const ICON_FILES = {
  clear: "clear-day",
  "partly-cloudy": "partly-cloudy-day",
  cloudy: "overcast",
  fog: "fog",
  rain: "rain",
  snow: "snow",
  thunderstorm: "thunderstorms",
  unknown: "not-available",
};

export function describeWeatherCode(code) {
  return CODES[code] || { label: "Unknown", icon: "unknown" };
}

// Decorative <img> (the condition is always also given as text nearby).
export function createWeatherIcon(code, className = "weather-icon") {
  const img = document.createElement("img");
  img.className = className;
  img.src = `assets/icons/weather/${ICON_FILES[describeWeatherCode(code).icon]}.svg`;
  img.alt = "";
  return img;
}
