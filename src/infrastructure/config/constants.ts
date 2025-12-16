const config = {
  storage: {
    type: process.env.DATABASE_TYPE || "memory",
  },
  weather: {
    provider: "openweather",
    apiKey: process.env.OPENWEATHER_API_KEY || "",
  },
};

export default config;
