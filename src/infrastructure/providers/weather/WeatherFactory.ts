import { WeatherFactory, WeatherProvider } from "../../../application/providers/WeatherFactory";
import config from "../../config/constants";
import { OpenWeatherProvider } from "./OpenWeatherProvider";

type WeatherProviderType = "openweather";

class WeatherProviderFactory implements WeatherFactory<WeatherProvider> {
  private static instance: WeatherProviderFactory;
  private weatherProvider?: WeatherProvider;

  private constructor() {}

  static getInstance(): WeatherProviderFactory {
    if (!WeatherProviderFactory.instance) {
      WeatherProviderFactory.instance = new WeatherProviderFactory();
    }
    return WeatherProviderFactory.instance;
  }

  get(type?: WeatherProviderType): WeatherProvider {
    if (this.weatherProvider) {
      return this.weatherProvider;
    }

    const providerType = (type ?? config.weather?.provider) as WeatherProviderType;

    switch (providerType) {
      case "openweather":
        const apiKey = config.weather?.apiKey;
        if (!apiKey) {
          throw new Error("OpenWeather API key not configured");
        }
        this.weatherProvider = new OpenWeatherProvider(apiKey);
        break;
      default:
        throw new Error(`Unknown weather provider: ${providerType}`);
    }

    return this.weatherProvider;
  }
}

export const weatherProviderFactory = WeatherProviderFactory.getInstance();
