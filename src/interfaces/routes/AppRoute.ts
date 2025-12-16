import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { ApplicationController } from "../controllers/AppController";
import { ApplicationStatus as ApplicationStatusDto } from "../dto/ApplicationStatus";

export class AppRoute {
  public prefix_route = "/app";

  constructor() {}

  async routes(app: FastifyInstance, options: FastifyPluginOptions, _done: any): Promise<void> {
    const appController = new ApplicationController();

    app.get<{ Reply: ApplicationStatusDto }>(
      "/",
      (request: FastifyRequest, reply: FastifyReply) => {
        return appController.getApplicationStatus(request, reply);
      }
    );
  }
}
