import { isAfter, isBefore, isValid, parseISO } from "date-fns";

type ComparisonOperator = "eq" | "is" | "ne" | "lt" | "lte" | "gt" | "gte" | "after" | "before";
type FailureOperator = ComparisonOperator | "exists";
type PrimitiveValue = string | number | boolean | Date;

type OperatorCondition = Partial<Record<ComparisonOperator, unknown>>;
interface NestedFieldCondition {
  [field: string]: OperatorCondition | PrimitiveValue | NestedFieldCondition;
}
type FieldCondition = OperatorCondition | PrimitiveValue | NestedFieldCondition;

type LogicalCondition = { and: ConditionNode[] } | { or: ConditionNode[] };
type ConditionNode = LogicalCondition | NestedFieldCondition;

type EvaluationResult = { success: boolean; failures: EvaluationFailure[] };
type EvaluationFailure = { path: string; operator: FailureOperator; expected: unknown; actual: unknown };

type InputData = Record<string, unknown>;

export class JSONCondition {
  private static readonly OPERATORS: ReadonlyArray<ComparisonOperator> = ["eq", "is", "ne", "lt", "lte", "gt", "gte", "after", "before"];

  public static resolve(conditions: ConditionNode[] | null | undefined, data: InputData): EvaluationResult {
    if (!conditions || conditions.length === 0) {
      return { success: true, failures: [] };
    }

    const failures: EvaluationFailure[] = [];
    const result = conditions.every((condition) => this.condition(condition, data, [], failures));
    return { success: result, failures };
  }

  private static condition(condition: ConditionNode, data: InputData, path: string[], failures: EvaluationFailure[]): boolean {
    if (!condition) {
      return true;
    }

    if (this.isAndCondition(condition)) {
      return condition.and.every((con) => this.condition(con, data, path, failures));
    }

    if (this.isOrCondition(condition)) {
      return condition.or.some((con) => this.condition(con, data, path, failures));
    }

    const fieldConditionMap = condition as NestedFieldCondition;
    for (const field in fieldConditionMap) {
      const fieldCondition = fieldConditionMap[field];
      const fieldValue = data[field];

      if (!this.resolveCondition(fieldValue, fieldCondition, [...path, field], failures)) {
        return false;
      }
    }

    return true;
  }

  private static resolveCondition(fieldValue: unknown, condition: FieldCondition, path: string[], failures: EvaluationFailure[]): boolean {
    if (typeof condition === "object" && condition !== null) {
      const conditionAsObject = condition as NestedFieldCondition | OperatorCondition;
      const keys = Object.keys(conditionAsObject);

      if (typeof fieldValue === "object" && fieldValue !== null && !(fieldValue instanceof Date)) {
        for (const key of keys) {
          const operatorValue = (conditionAsObject as Record<string, FieldCondition>)[key];

          if (JSONCondition.OPERATORS.includes(key as ComparisonOperator)) {
            const actual = (fieldValue as Record<string, unknown> | undefined)?.[key];
            if (!this.operator(actual, key, operatorValue, [...path, key], failures)) {
              return false;
            }
          } else {
            if (!this.resolveCondition((fieldValue as Record<string, unknown> | undefined)?.[key], operatorValue, [...path, key], failures)) {
              return false;
            }
          }
        }
        return true;
      }

      for (const operator of keys) {
        const operatorValue = (conditionAsObject as Record<string, FieldCondition>)[operator];

        if (!this.operator(fieldValue, operator, operatorValue, path, failures)) {
          return false;
        }
      }
      return true;
    }

    const ok = fieldValue === condition;
    if (!ok) {
      this.logFailure(path, "eq", condition, fieldValue, failures);
    }
    return ok;
  }

  private static operator(fieldValue: unknown, operator: string, operatorValue: FieldCondition, path: string[], failures: EvaluationFailure[]): boolean {
    if (JSONCondition.OPERATORS.includes(operator as ComparisonOperator)) {
      switch (operator as ComparisonOperator) {
        case "eq":
        case "is":
          if (fieldValue === operatorValue) return true;
          break;

        case "ne":
          if (fieldValue !== operatorValue) return true;
          break;

        case "lt":
          if ((fieldValue as number) < (operatorValue as number)) return true;
          break;

        case "lte":
          if ((fieldValue as number) <= (operatorValue as number)) return true;
          break;

        case "gt":
          if ((fieldValue as number) > (operatorValue as number)) return true;
          break;

        case "gte":
          if ((fieldValue as number) >= (operatorValue as number)) return true;
          break;

        case "after":
          if (JSONCondition.compareDates(fieldValue, operatorValue, "after")) return true;
          break;

        case "before":
          if (JSONCondition.compareDates(fieldValue, operatorValue, "before")) return true;
          break;
      }

      this.logFailure(path, operator as ComparisonOperator, operatorValue, fieldValue, failures);
      return false;
    }

    if (typeof operatorValue === "object" && operatorValue !== null) {
      const nestedValue = (fieldValue as Record<string, unknown> | undefined)?.[operator];
      const ok = this.resolveCondition(nestedValue, operatorValue, [...path, operator], failures);
      if (!ok && nestedValue === undefined) {
        this.logFailure([...path, operator], "exists", true, nestedValue, failures);
      }
      return ok;
    }

    const ok = (fieldValue as Record<string, unknown> | undefined)?.[operator] === operatorValue;
    if (!ok) {
      this.logFailure([...path, operator], "eq", operatorValue, (fieldValue as Record<string, unknown> | undefined)?.[operator], failures);
    }
    return ok;
  }

  private static logFailure(path: string[], operator: FailureOperator, expected: unknown, actual: unknown, failures: EvaluationFailure[]): void {
    failures.push({ path: path.join("."), operator, expected, actual });
  }

  private static isAndCondition(condition: ConditionNode): condition is { and: ConditionNode[] } {
    return Array.isArray((condition as { and?: unknown }).and);
  }

  private static isOrCondition(condition: ConditionNode): condition is { or: ConditionNode[] } {
    return Array.isArray((condition as { or?: unknown }).or);
  }

  private static compareDates(fieldValue: unknown, compareValue: unknown, operator: "after" | "before"): boolean {
    const fieldDate = this.parseDate(fieldValue);
    const compareDate = this.parseDate(compareValue);

    if (!fieldDate || !compareDate) {
      return false;
    }

    if (operator === "after") {
      return isAfter(fieldDate, compareDate);
    }

    return isBefore(fieldDate, compareDate);
  }

  private static parseDate(value: unknown): Date | null {
    if (value instanceof Date) {
      return isValid(value) ? value : null;
    }

    if (typeof value === "string") {
      try {
        const date = parseISO(value);
        return isValid(date) ? date : null;
      } catch {
        return null;
      }
    }

    if (typeof value === "number") {
      const date = new Date(value);
      return isValid(date) ? date : null;
    }

    return null;
  }
}
