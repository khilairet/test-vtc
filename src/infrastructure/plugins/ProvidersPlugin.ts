import { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { WeatherProvider } from "../../application/providers/WeatherFactory";
import { weatherProviderFactory } from "../providers/weather/WeatherFactory";

export default fastifyPlugin(async (app: FastifyInstance) => {
  const weatherProvider = weatherProviderFactory.get();
  app.decorate("weatherProvider", weatherProvider);
});

declare module "fastify" {
  export interface FastifyInstance {
    weatherProvider: WeatherProvider;
  }
}
