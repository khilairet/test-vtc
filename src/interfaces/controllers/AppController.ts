import { FastifyReply, FastifyRequest } from "fastify";
import { ApplicationStatus } from "../dto/ApplicationStatus";

/**
 * Controller for application status
 */
export class ApplicationController {
  /**
   * Get the current application status
   * @param request 
   * @param reply 
   * @returns 
   */
  public async getApplicationStatus(request: FastifyRequest, reply: FastifyReply): Promise<ApplicationStatus> {
    try {
      return reply.code(200).send({
        version: process.env.npm_package_version,
        uptime: process.uptime(),
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  }
}
