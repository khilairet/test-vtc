import { Discount, DiscountValidated } from "../../domain/models/discount/Discount";
import { CreateDiscountParams, DiscountService, GetDiscountParams, ValidateDiscountParams } from "../DiscountService";
import { WeatherData, WeatherProvider } from "../providers/WeatherFactory";
import { DiscountRepository } from "../repositories/DiscountRepository";

/**
 * Implementation of the DiscountService interface
 */
export class DiscountServiceImpl implements DiscountService {
  constructor(private readonly discountRepository: DiscountRepository, private readonly weatherProvider?: WeatherProvider) {}

  public async getOneByName(params: GetDiscountParams): Promise<Discount | null> {
    const discount = await this.discountRepository.findOneByName(params.name);
    return discount || null;
  }

  public async validate(discount: Discount, params: ValidateDiscountParams): Promise<DiscountValidated> {
    const value = { age: params.age, town: params.town, date: new Date(), weather: undefined as WeatherData | undefined };
    if (params.town && this.weatherProvider) {
      const weather = await this.weatherProvider.getCurrentWeather(params.town);
      value.weather = weather;
    }

    return discount.validated(value);
  }

  public async create(params: CreateDiscountParams): Promise<Discount> {
    const discount = new Discount({
      name: params.name,
      advantage: params.advantage,
      restrictions: params.restrictions ?? [],
    });
    return this.discountRepository.create(discount);
  }
}
