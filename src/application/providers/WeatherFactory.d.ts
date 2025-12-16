export interface WeatherFactory<T> {
  get(type?: string): T;
}

export interface WeatherData {
  is: string;
  temp: number;
}

export interface WeatherProvider {
  /**
   * Get current weather for a given town
   * @param town 
   */
  getCurrentWeather(town: string): Promise<WeatherData>;
}
