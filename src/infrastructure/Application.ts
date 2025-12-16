import { FastifyBaseLogger, RawServerDefault } from "fastify";
import { Server } from "./http/Server";

export class Application {
  private server: Server;
  public readonly logger: FastifyBaseLogger;

  constructor(appInit: { plugins: any; routes: any }) {
    this.server = new Server();
    this.logger = this.server.instance.log;

    this.register(appInit.plugins);
    this.bindRoutes(appInit.routes);
  }

  private bindRoutes(routes: Array<{ route: any; options: any }>): void {
    routes.forEach(({ route, options }) => {
      const router = new route();
      this.server.instance.register(router.routes, {
        prefix: router.prefix_route,
        ...options,
      });
    });
  }

  private register(plugins: { forEach: (arg0: (plugin: any) => void) => void }) {
    plugins.forEach((plugin) => {
      this.server.instance.register(plugin);
    });
  }

  public async start(): Promise<RawServerDefault> {
    const instance = await this.server.start();
    return instance;
  }

  public async stop(): Promise<void> {
    if (this.server) {
      try {
        await this.server.stop();
      } catch (err) {
        this.logger.error(err);
      }
    }
  }
}
