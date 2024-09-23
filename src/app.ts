import dotenv from 'dotenv'
import Fastify from 'fastify'
import { database } from './database'
import { createUser } from './users'

dotenv.config()

async function main() {
  const fastify = Fastify()

  // ---------------------------------------------------------------------------
  // Shutdown handlers and hooks
  // ---------------------------------------------------------------------------

  // Ctrl-C handler
  process.on('SIGINT', () => {
    console.log('Process interrupted')
    fastify.close().then(() => {
      process.exit(0)
    })
  })

  fastify.addHook('onClose', (instance, done) => {
    console.log('Fastify is shutting down...')
    done()
  })

  // ---------------------------------------------------------------------------
  // Register Sequelize database plugin
  // ---------------------------------------------------------------------------

  await fastify.register(database, {
    database: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    host: process.env.DB_HOST!
  })

  // ---------------------------------------------------------------------------
  // Test create user route
  // ---------------------------------------------------------------------------

  fastify.post(
    '/user',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 }
          }
        }
      }
    },
    createUser
  )

  // ---------------------------------------------------------------------------
  // Start the server
  // ---------------------------------------------------------------------------

  fastify.listen({ port: 3000 }, (err, address) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    console.log(`Server listening at ${address}`)
  })
}

main()
