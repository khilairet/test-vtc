import { Discount } from "../../domain/models/discount/Discount";
import { Id } from "../../domain/models/Id";
import { MemoryDiscountRepository } from "../../infrastructure/repositories/memory/MemoryDiscountRepository";
import { WeatherProvider } from "../providers/WeatherFactory";
import { DiscountServiceImpl } from "./DiscountServiceImpl";

describe("DiscountServiceImpl", () => {
  let discountService: DiscountServiceImpl;
  let discountRepository: MemoryDiscountRepository;
  let mockWeatherProvider: WeatherProvider;

  beforeEach(async () => {
    discountRepository = new MemoryDiscountRepository();

    // Mock the weather provider
    mockWeatherProvider = {
      getCurrentWeather: jest.fn().mockResolvedValue({
        is: "sunny",
        temp: 20,
      }),
    } as unknown as WeatherProvider;

    discountService = new DiscountServiceImpl(discountRepository, mockWeatherProvider);
  });

  describe("getOneByName", () => {
    it("should return a discount by name", async () => {
      const discount = new Discount({
        id: Id.create(),
        name: "SUMMER2025",
        advantage: { percent: 20 },
        restrictions: [{ age: { gt: 18, lt: 65 } }],
      });

      await discountRepository.create(discount);

      const result = await discountService.getOneByName({ name: "SUMMER2025" });
      expect(result).not.toBeNull();
      expect(result!.name).toBe("SUMMER2025");
      expect(result!.advantage.percent).toBe(20);
    });

    it("should return null when discount does not exist", async () => {
      const result = await discountService.getOneByName({ name: "NONEXISTENT" });
      expect(result).toBeNull();
    });
  });

  describe("validate", () => {
    let discount: Discount;

    beforeEach(async () => {
      discount = new Discount({
        id: Id.create(),
        name: "SUMMER2025",
        advantage: { percent: 20 },
        restrictions: [{ age: { gt: 18, lt: 65 } }],
      });
      await discountRepository.create(discount);
    });

    it("should validate discount with valid parameters", async () => {
      const result = await discountService.validate(discount, { age: 25, town: "Paris" });
      expect(result.success).toBe(true);
      expect(result.failures).toHaveLength(0);
    });

    it("should call getCurrentWeather when town is provided", async () => {
      await discountService.validate(discount, { age: 25, town: "Paris" });
      expect(mockWeatherProvider.getCurrentWeather).toHaveBeenCalledWith("Paris");
    });

    it("should not call getCurrentWeather when town is not provided", async () => {
      await discountService.validate(discount, { age: 25 });
      expect(mockWeatherProvider.getCurrentWeather).not.toHaveBeenCalled();
    });

    it("should invalidate discount when age restriction fails", async () => {
      const result = await discountService.validate(discount, { age: 70 });
      expect(result.success).toBe(false);
      expect(result.failures.length).toBeGreaterThan(0);
    });

    it("should validate discount without restrictions", async () => {
      const unrestricted = new Discount({
        id: Id.create(),
        name: "UNLIMITED",
        advantage: { percent: 10 },
        restrictions: [],
      });

      const result = await discountService.validate(unrestricted, { age: 70 });
      expect(result.success).toBe(true);
    });
  });

  describe("create", () => {
    it("should create a new discount", async () => {
      const result = await discountService.create({
        name: "NEWYEAR2025",
        advantage: { percent: 50 },
        restrictions: [{ age: { gt: 0 } }],
      });

      expect(result.name).toBe("NEWYEAR2025");
      expect(result.advantage.percent).toBe(50);
      expect(result.restrictions).toHaveLength(1);
    });

    it("should create a discount with empty restrictions", async () => {
      const result = await discountService.create({
        name: "UNLIMITED",
        advantage: { percent: 25 },
        restrictions: [],
      });

      expect(result.name).toBe("UNLIMITED");
      expect(result.restrictions).toHaveLength(0);
    });

    it("should generate an id for new discount", async () => {
      const result = await discountService.create({
        name: "TEST",
        advantage: { percent: 15 },
        restrictions: [],
      });

      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe("string");
    });
  });

  describe("service without weather provider", () => {
    beforeEach(() => {
      discountService = new DiscountServiceImpl(discountRepository);
    });

    it("should validate discount without weather provider", async () => {
      const discount = new Discount({
        id: Id.create(),
        name: "TEST",
        advantage: { percent: 20 },
        restrictions: [],
      });

      const result = await discountService.validate(discount, { age: 25, town: "Paris" });
      expect(result.success).toBe(true);
      expect(result.failures).toHaveLength(0);
    });
  });
});
