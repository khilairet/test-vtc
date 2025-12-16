import { FastifyReply, FastifyRequest } from "fastify";
import { CreateDiscountParams, DiscountService } from "../../application/DiscountService";
import { Discount } from "../dto/Discount";
import { DiscountSerializer } from "../serializers/DiscountSerializer";

/**
 * Controller for managing discounts
 */
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  /**
   * Validate a discount by name with given parameters
   * @param request
   * @param reply
   * @returns
   */
  public async validateDiscount(request: FastifyRequest, reply: FastifyReply): Promise<{ success: boolean; failures: any[] }> {
    try {
      let { name } = request.params as { name: string };
      let { age, town } = request.query as { age?: number; town?: string };

      if(!name) {
        const { promocode_name, arguments: args } = request.body as { promocode_name: string; arguments?: { age?: number; town?: string } };
        name = promocode_name;
        age = args?.age;
        town = args?.town;
      }

      const discount = await this.discountService.getOneByName({ name });

      if (!discount) {
        return reply.code(404).send({ error: `Discount not found: ${name}` });
      }

      const result = await this.discountService.validate(discount, {
        age,
        town,
      });

      return reply.code(result.success ? 200 : 403).send(DiscountSerializer.serializeValidate(discount, result));
    } catch (error) {
      return reply.code(500).send({ error: "Internal server error" });
    }
  }

  /**
   * Add a new discount
   * @param request
   * @param reply
   * @returns
   */
  public async newDiscount(request: FastifyRequest, reply: FastifyReply): Promise<Discount> {
    try {
      const { name, advantage, restrictions } = request.body as CreateDiscountParams;

      const discountExist = await this.discountService.getOneByName({ name });
      if (discountExist) {
        return reply.code(409).send({ error: `Discount with name ${name} already exists.` });
      }

      const discount = await this.discountService.create({ name, advantage, restrictions });

      return reply.code(201).send(DiscountSerializer.serialize(discount));
    } catch (error) {
      return reply.code(500).send(error);
    }
  }
}
