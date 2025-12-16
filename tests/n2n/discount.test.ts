import { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { WeatherProvider } from "../../src/application/providers/WeatherFactory";
import { Discount } from "../../src/domain/models/discount/Discount";
import { Id } from "../../src/domain/models/Id";
import { Application } from "../../src/infrastructure/Application";
import { MemoryDiscountRepository } from "../../src/infrastructure/repositories/memory/MemoryDiscountRepository";
import { AppRoute } from "../../src/interfaces/routes/AppRoute";
import { DiscountRoute } from "../../src/interfaces/routes/DiscountRoute";

describe("DiscountRoute", () => {
  let app: Application;
  let fastifyInstance: FastifyInstance;
  let discountRepository: MemoryDiscountRepository;
  let mockWeatherProvider: WeatherProvider;

  beforeAll(async () => {
    discountRepository = new MemoryDiscountRepository();

    mockWeatherProvider = {
      getCurrentWeather: jest.fn().mockResolvedValue({
        is: "sunny",
        temp: 20,
      }),
    } as unknown as WeatherProvider;

    const mockWeatherPlugin = fastifyPlugin(async (app: FastifyInstance) => {
      app.decorate("weatherProvider", mockWeatherProvider);
    });

    // Create and persist a discount for validation tests
    const discount = new Discount({
      id: Id.create(),
      name: "SUMMER2025",
      advantage: { percent: 20 },
      restrictions: [{ age: { gt: 18, lt: 65 } }],
    });

    await discountRepository.create(discount);

    // Use an ephemeral port to avoid conflicts between tests
    process.env.SERVER_PORT = "0";

    app = new Application({
      plugins: [mockWeatherPlugin],
      routes: [
        {
          route: DiscountRoute,
          options: { repository: discountRepository },
        },
        {
          route: AppRoute,
          options: {},
        },
      ],
    });

    await app.start();

    // Access the Fastify instance through the private server property
    fastifyInstance = (app as any).server.instance;
  });

  afterAll(async () => {
    await app.stop();
  });

  describe("GET /discount/:name", () => {
    it("should validate a discount with valid parameters", async () => {
      const response = await fastifyInstance.inject({
        method: "GET",
        url: "/discount/SUMMER2025?age=25&town=Paris",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("status");
      expect(body.status).toBe("accepted");
      expect(body).toHaveProperty("promocode_name");
      expect(body.promocode_name).toBe("SUMMER2025");
    });

    it("should return 404 when discount not found", async () => {
      const response = await fastifyInstance.inject({
        method: "GET",
        url: "/discount/NONEXISTENT?age=25",
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("error");
    });

    it("should validate against restrictions", async () => {
      const response = await fastifyInstance.inject({
        method: "GET",
        url: "/discount/SUMMER2025?age=70",
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("denied");
      expect(body).toHaveProperty("reasons");
    });
  });

  describe("POST /discount/", () => {
    it("should create a new discount", async () => {
      const response = await fastifyInstance.inject({
        method: "POST",
        url: "/discount/",
        payload: {
          name: "WINTER2025",
          advantage: {
            percent: 30,
          },
          restrictions: [
            {
              age: { gt: 18 },
            },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.promocode_name).toBe("WINTER2025");
      expect(body.advantage.percent).toBe(30);
      expect(body).toHaveProperty("restrictions");
    });

    it("should create a discount without restrictions", async () => {
      const response = await fastifyInstance.inject({
        method: "POST",
        url: "/discount/",
        payload: {
          name: "BLACKFRIDAY",
          advantage: {
            percent: 50,
          },
          restrictions: [],
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.promocode_name).toBe("BLACKFRIDAY");
      expect(body.advantage.percent).toBe(50);
      expect(body.restrictions).toEqual([]);
    });

    it("should validate required fields", async () => {
      const response = await fastifyInstance.inject({
        method: "POST",
        url: "/discount/",
        payload: {
          name: "TEST",
          // Missing advantage and restrictions
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
