/* eslint-disable @typescript-eslint/no-explicit-any */
import 'fastify'
import { Model, ModelCtor } from 'sequelize'

declare module 'fastify' {
  interface FastifyInstance {
    // Needed for decorate()
    database: {
      users: ModelCtor<Model<any, any>>
    }
  }
}
