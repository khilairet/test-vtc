import { WeatherData, WeatherProvider } from "../../../application/providers/WeatherFactory";

export class OpenWeatherProvider implements WeatherProvider {
  private apiKey: string;
  private apiUrl: string = "https://api.openweathermap.org/data/2.5/weather";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  public async getCurrentWeather(city: string): Promise<WeatherData> {
    const response = await fetch(`${this.apiUrl}?q=${encodeURIComponent(city)}&appid=${this.apiKey}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch weather data: ${response.statusText}`);
    }
    const data: any = await response.json();

    return {
      is: data.weather[0].main.toLowerCase(),
      temp: data.main.temp,
    };
  }
}
