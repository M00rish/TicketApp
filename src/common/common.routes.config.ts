import express from 'express';

/**
 * Represents a common routes configuration for an express application.
 */
export abstract class CommonRoutesConfig {
  app: express.Application;
  name: string;

  /**
   * Constructs a new instance of the CommonRoutesConfig class.
   * @param app - The express application.
   * @param name - The name of the routes configuration.
   */
  constructor(app: express.Application, name: string) {
    this.app = app;
    this.name = name;
    // this.configureRoutes();
  }

  /**
   * Gets the name.
   *
   * @returns The name.
   */
  getName() {
    return this.name;
  }

  /**
   * Configures the routes for the express application.
   *
   * @returns The configured express application.
   */
  abstract configureRoutes(): express.Application;
}
