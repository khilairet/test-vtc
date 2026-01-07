import cors from "@fastify/cors";
import Fastify, { FastifyInstance, FastifyReply, FastifyRequest, RawServerDefault } from "fastify";

export class Server {
  public readonly instance: FastifyInstance;
  private rawServer: RawServerDefault | null = null;

  constructor() {
    this.instance = Fastify({
      logger: true,
    });
  }

  private async loadMiddlewares(): Promise<void> {
    await this.instance.register(cors, {
      origin: (origin, cb) => {
        if (!origin) {
          cb(null, true);
          return;
        }

        const allowedOrigins = (process.env.SERVER_CORS_ORIGINS || "").split(",").map((o) => o.trim());
        if (allowedOrigins.includes(origin)) {
          cb(null, true);
          return;
        }
        cb(new Error("Not allowed"), false);
      },
    });
  }

  private handleError(error: Error, request: FastifyRequest, reply: FastifyReply): void {
    if (error instanceof Fastify.errorCodes.FST_ERR_BAD_STATUS_CODE) {
      this.instance.log.error(error);

      reply.status(500).send({
        message: process.env.NODE_ENV === "production" ? "An unexpected error occurred" : error.message,
        name: error.name,
        stack: process.env.NODE_ENV === "production" ? null : error.stack,
      });
    } else {
      reply.send(error);
    }
  }

  public start(): Promise<RawServerDefault> {
    if (this.rawServer) {
      return Promise.resolve(this.rawServer);
    }

    return new Promise<RawServerDefault>(async (resolve, reject) => {
      try {
        this.instance.setErrorHandler(this.handleError);
        await this.loadMiddlewares();

        const host = process.env.SERVER_HOST ? process.env.SERVER_HOST : "0.0.0.0";
        const port = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT, 10) : 8080;
        await this.instance.listen({ port: port, host: host });
        this.rawServer = this.instance.server;
        this.instance.log.info(`Server started on port ${port}`);

        resolve(this.rawServer);
      } catch (err) {
        this.instance.log.error(err);
        reject(err);
      }
    });
  }

  public stop(): Promise<void> {
    if (!this.rawServer) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      this.rawServer?.close((err) => {
        this.rawServer = null;

        if (err) {
          return reject(err);
        }

        return resolve();
      });
    });
  }
}
