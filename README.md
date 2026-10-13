# Otter Weather

A playful weather app that tells a US college student what to wear and carry today (or any day in the next week). An otter character changes outfit with the forecast, and reminders and a packing checklist come from the same recommendation.

**Live app:** https://sebastiannieto-official.github.io/OtterWeatherApp/

An AET 330T student project by [SebastianNieto-Official](https://github.com/SebastianNieto-Official) on GitHub.

## What it does

- Forecast for any US city or your device location: today plus the next six days, with an hourly row and precipitation chart.
- An otter dressed for the feels-like temperature, with umbrella, poncho, sunscreen, hat and hydration reminders and a packing checklist.
- Light by day and dark at night, switching at the location's sunrise and sunset (or choose manually on the Details screen).
- Works on phones and laptops, by touch, mouse or keyboard.

## Privacy

No accounts, cookies or analytics. Only your most recent location is saved, in your browser. Your coordinates or place name are sent to Open-Meteo to fetch the forecast. Location is requested only when you tap "Use my location".

## Credits

- Weather data: [Open-Meteo](https://open-meteo.com) (CC BY 4.0), used under its free non-commercial terms.
- The otter, backpack and poncho/hat/sunscreen icons were generated with Google Gemini. The clothing layers were drawn as SVG by Claude (Anthropic).
- Weather icons: [Meteocons](https://github.com/basmilius/weather-icons) (MIT). Interface icons: [Lucide](https://lucide.dev) (ISC). Their license notices are in [assets/icons/LICENSES.txt](assets/icons/LICENSES.txt).

## Running it locally

There is no build step. Serve the folder over HTTP (for example `python -m http.server 8080`) and open `http://localhost:8080/`. Browsers need HTTP, not `file://`, for ES modules and location.
