/**
 * SolarAudit — Projects feature: Default service instance
 *
 * The composition root for the Projects feature. Components get the
 * service from here (or from a React context that provides this same
 * object). When real persistence arrives, this file changes — nothing
 * else in the feature does.
 */

import { createInMemoryProjectRepository } from "./inMemoryProjectRepository";
import { createProjectsService } from "./projectsService";

export const defaultProjectsService = createProjectsService(
  createInMemoryProjectRepository(),
);
