import "dotenv/config";
import { Application } from "./infrastructure/Application";
import WeatherPlugin from "./infrastructure/plugins/ProvidersPlugin";
import { repositoryFactory } from "./infrastructure/repositories/RepositoryFactory";
import { AppRoute } from "./interfaces/routes/AppRoute";
import { DiscountRoute } from "./interfaces/routes/DiscountRoute";

const app = new Application({
  plugins: [WeatherPlugin],
  routes: [
    {
      route: AppRoute,
    },
    {
      route: DiscountRoute,
      options: {
        repository: repositoryFactory.getDiscountRepository(),
      },
    },
  ],
});

function gracefullyShutDownApplication(signal: NodeJS.Signals): void {
  app.logger.warn(`Received ${signal}, shutting down application`);
  app.stop();
}

// Listen to SIGTERM and SIGINT to gracefully shut down the application
process.on("SIGTERM", gracefullyShutDownApplication);
process.on("SIGINT", gracefullyShutDownApplication);

app.start().catch((err: Error) => {
  app.logger.error(err);
  process.exit(1);
});
