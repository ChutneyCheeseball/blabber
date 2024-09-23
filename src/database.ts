import { FastifyInstance } from 'fastify'
import { Sequelize } from 'sequelize'

interface dbOptions {
  database: string
  user: string
  password: string
  host: string
}

export function database(fastify: FastifyInstance, opts: dbOptions, done: (error?: Error) => void) {
  // Init db instance
  const sequelize = new Sequelize(opts.database, opts.user, opts.password, {
    host: opts.host,
    dialect: 'mysql'
  })

  // ---------------------------------------------------------------------------
  // Test our database connection - add hooks and decorators if good
  // Otherwise, let Fastify know to give up
  // ---------------------------------------------------------------------------

  sequelize
    .authenticate()
    // All good
    .then(() => {
      console.log('DB connection is good')
      // Close db on fastify shutdown
      fastify.addHook('onClose', (_, done) => {
        console.log('DB shutting down...')
        sequelize.close().finally(() => done())
      })
      done()
    })
    // Could not connect to db
    .catch((error) => {
      console.error(error)
      done(new Error('DB connection failed.'))
    })
}
