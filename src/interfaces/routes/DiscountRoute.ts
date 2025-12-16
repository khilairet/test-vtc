import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { DiscountServiceImpl } from "../../application/implementation/DiscountServiceImpl";
import { DiscountRepository } from "../../application/repositories/DiscountRepository";
import { DiscountController } from "../controllers/DiscountController";
import { Discount as DicountDto } from "../dto/Discount";

interface DiscountRouteOptions {
  repository: DiscountRepository;
}

export class DiscountRoute {
  public prefix_route = "/discount";

  constructor() {}

  async routes(app: FastifyInstance, options: DiscountRouteOptions, _done: any): Promise<void> {
    const discountService = new DiscountServiceImpl(options.repository, app.weatherProvider);
    const discountController = new DiscountController(discountService);

    app.post<{ Body: any; Reply: { success: boolean; failures: any[] } }>(
      "/validate",
      {
        schema: {
          body: {
            type: "object",
            required: ["promocode_name"],
            properties: {
              promocode_name: { type: "string", description: "Name of the discount to validate" },
              arguments: {
                type: "object",
                description: "Contextual arguments for validation",
                properties: {
                  age: { type: "number", description: "Age of the user" },
                  town: { type: "string", description: "Town of the user" },
                },
              },
            },
          },
        },
      },
      (request: FastifyRequest, reply: FastifyReply) => {
        return discountController.validateDiscount(request, reply);
      }
    );

    app.get<{ Params: { name: string }; Querystring: any; Reply: { success: boolean; failures: any[] } }>(
      "/:name",
      {
        schema: {
          params: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string", description: "Name of the discount to validate" },
            },
          },
          querystring: {
            type: "object",
            properties: {
              age: { type: "number", description: "Age of the user" },
              town: { type: "string", description: "Town of the user" },
            },
          },
        },
      },
      (request: FastifyRequest, reply: FastifyReply) => {
        return discountController.validateDiscount(request, reply);
      }
    );

    app.post<{ Body: any; Reply: DicountDto }>(
      "/",
      {
        schema: {
          body: {
            type: "object",
            required: ["name", "advantage", "restrictions"],
            properties: {
              name: { type: "string", description: "Name of the discount to retrieve" },
              advantage: {
                type: "object",
                description: "Advantage details",
                properties: { percent: { type: "number", description: "Percentage advantage" } },
              },
              restrictions: {
                type: "array",
                description: "List of restrictions",
                items: { type: "object" },
              },
            },
          },
        },
      },
      (request: FastifyRequest, reply: FastifyReply) => {
        return discountController.newDiscount(request, reply);
      }
    );
  }
}
