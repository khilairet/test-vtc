import { DiscountRepository } from "../../application/repositories/DiscountRepository";
import config from "../config/constants";
import { MemoryDiscountRepository } from "./memory/MemoryDiscountRepository";

type StorageType = "memory";

class RepositoryFactory {
  private static instance: RepositoryFactory;
  private discountRepository?: DiscountRepository;

  private constructor() {}

  static getInstance(): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory();
    }
    return RepositoryFactory.instance;
  }

  getDiscountRepository(): DiscountRepository {
    if (this.discountRepository) {
      return this.discountRepository;
    }

    const storageType = config.storage.type as StorageType;

    switch (storageType) {
      case "memory":
        this.discountRepository = new MemoryDiscountRepository();
        break;
      default:
        throw new Error(`Unknown storage type: ${storageType}`);
    }

    return this.discountRepository;
  }
}

export const repositoryFactory = RepositoryFactory.getInstance();
