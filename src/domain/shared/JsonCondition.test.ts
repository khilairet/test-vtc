import { JSONCondition } from "./JsonCondition";

const runAll = (restrictions: any[], data: any) => JSONCondition.resolve(restrictions, data).success;

describe("JSONCondition", () => {
  describe("Operators", () => {
    test("eq", () => {
      expect(runAll([{ age: { eq: 25 } }], { age: 25 })).toBe(true);
      expect(runAll([{ age: { eq: 25 } }], { age: 30 })).toBe(false);
    });

    test("is", () => {
      expect(runAll([{ status: { is: "active" } }], { status: "active" })).toBe(true);
      expect(runAll([{ status: { is: "active" } }], { status: "inactive" })).toBe(false);
    });

    test("ne", () => {
      expect(runAll([{ age: { ne: 25 } }], { age: 30 })).toBe(true);
      expect(runAll([{ age: { ne: 25 } }], { age: 25 })).toBe(false);
    });

    test("lt", () => {
      expect(runAll([{ age: { lt: 30 } }], { age: 25 })).toBe(true);
      expect(runAll([{ age: { lt: 30 } }], { age: 35 })).toBe(false);
      expect(runAll([{ age: { lt: 30 } }], { age: 30 })).toBe(false);
    });

    test("lte", () => {
      expect(runAll([{ age: { lte: 30 } }], { age: 30 })).toBe(true);
      expect(runAll([{ age: { lte: 30 } }], { age: 25 })).toBe(true);
      expect(runAll([{ age: { lte: 30 } }], { age: 35 })).toBe(false);
    });

    test("gt", () => {
      expect(runAll([{ age: { gt: 18 } }], { age: 25 })).toBe(true);
      expect(runAll([{ age: { gt: 18 } }], { age: 15 })).toBe(false);
      expect(runAll([{ age: { gt: 18 } }], { age: 18 })).toBe(false);
    });

    test("gte", () => {
      expect(runAll([{ age: { gte: 18 } }], { age: 18 })).toBe(true);
      expect(runAll([{ age: { gte: 18 } }], { age: 25 })).toBe(true);
      expect(runAll([{ age: { gte: 18 } }], { age: 15 })).toBe(false);
    });

    test("Multiples operators on the same field", () => {
      expect(runAll([{ age: { gt: 15, lt: 30 } }], { age: 25 })).toBe(true);
      expect(runAll([{ age: { gt: 15, lt: 30 } }], { age: 35 })).toBe(false);
      expect(runAll([{ age: { gt: 15, lt: 30 } }], { age: 10 })).toBe(false);
    });
  });

  describe("Logic operators", () => {
    test("and", () => {
      const condition = [
        {
          and: [{ age: { gt: 18 } }, { status: { is: "active" } }],
        },
      ];

      expect(runAll(condition, { age: 25, status: "active" })).toBe(true);
      expect(runAll(condition, { age: 15, status: "active" })).toBe(false);
      expect(runAll(condition, { age: 25, status: "inactive" })).toBe(false);
    });

    test("or", () => {
      const condition = [
        {
          or: [{ age: { eq: 40 } }, { status: { is: "premium" } }],
        },
      ];

      expect(runAll(condition, { age: 40, status: "basic" })).toBe(true);
      expect(runAll(condition, { age: 25, status: "premium" })).toBe(true);
      expect(runAll(condition, { age: 40, status: "premium" })).toBe(true);
      expect(runAll(condition, { age: 25, status: "basic" })).toBe(false);
    });

    test("And & Or", () => {
      const condition = [
        {
          and: [
            { country: { is: "FR" } },
            {
              or: [{ age: { gte: 18 } }, { parental_consent: { eq: true } }],
            },
          ],
        },
      ];

      expect(runAll(condition, { country: "FR", age: 25 })).toBe(true);
      expect(runAll(condition, { country: "FR", age: 16, parental_consent: true })).toBe(true);
      expect(runAll(condition, { country: "US", age: 25 })).toBe(false);
      expect(runAll(condition, { country: "FR", age: 16, parental_consent: false })).toBe(false);
    });
  });

  describe("Operator date", () => {
    test("after", () => {
      expect(runAll([{ date: { after: "2020-01-01" } }], { date: new Date() })).toBe(true);
      expect(runAll([{ date: { after: "2020-01-01" } }], { date: "2021-06-15" })).toBe(true);

      expect(runAll([{ date: { after: "2020-01-01" } }], { date: "2019-12-31" })).toBe(false);
    });

    test("before", () => {
      expect(runAll([{ date: { before: "2020-12-31" } }], { date: "2020-06-15" })).toBe(true);

      expect(runAll([{ date: { before: "2020-12-31" } }], { date: "2021-01-01" })).toBe(false);
    });

    test("After & Before", () => {
      const condition = [
        {
          date: {
            after: "2019-01-01",
            before: "2020-06-30",
          },
        },
      ];

      expect(runAll(condition, { date: "2019-06-15" })).toBe(true);
      expect(runAll(condition, { date: "2020-01-01" })).toBe(true);
      expect(runAll(condition, { date: "2018-12-31" })).toBe(false);
      expect(runAll(condition, { date: "2020-07-01" })).toBe(false);
    });

    test("With date object", () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      expect(runAll([{ date: { after: yesterday } }], { date: now })).toBe(true);

      expect(runAll([{ date: { before: tomorrow } }], { date: now })).toBe(true);
    });
  });

  describe("Condition with weather field", () => {
    test("Conditions with temp and is", () => {
      const data = {
        weather: {
          is: "clear",
          temp: 20,
        },
      };

      const condition = [
        {
          weather: {
            is: "clear",
            temp: { gt: 15 },
          },
        },
      ];

      expect(runAll(condition, data)).toBe(true);
    });
  });

  describe("Complete sample restrictions", () => {
    test("Multiples restrictions with date, age and weather", () => {
      const restrictions = [
        {
          date: {
            after: "2019-01-01",
            before: "2020-06-30",
          },
        },
        {
          or: [
            {
              age: { eq: 40 },
            },
            {
              and: [
                {
                  age: {
                    lt: 30,
                    gt: 15,
                  },
                },
                {
                  weather: {
                    is: "clear",
                    temp: { gt: 15 },
                  },
                },
              ],
            },
          ],
        },
      ];

      expect(
        runAll(restrictions, {
          date: "2019-06-15",
          age: 40,
          weather: { is: "rainy", temp: 10 },
        })
      ).toBe(true);

      expect(
        runAll(restrictions, {
          date: "2019-06-15",
          age: 25,
          weather: { is: "clear", temp: 20 },
        })
      ).toBe(true);

      expect(
        runAll(restrictions, {
          date: "2021-01-01",
          age: 25,
          weather: { is: "clear", temp: 20 },
        })
      ).toBe(false);

      expect(
        runAll(restrictions, {
          date: "2019-06-15",
          age: 35,
          weather: { is: "clear", temp: 20 },
        })
      ).toBe(false);

      expect(
        runAll(restrictions, {
          date: "2019-06-15",
          age: 25,
          weather: { is: "clear", temp: 10 },
        })
      ).toBe(false);
    });
  });
});
