import dotenv from 'dotenv'
import Fastify from 'fastify'
import { database } from './database'
import { createUser, loginUser, testUser } from './users'
import { createBlab, getBlabs, getMentionedBlabs } from './blabs'
import fjwt from 'fastify-jwt'

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
  // JSON web token
  // ---------------------------------------------------------------------------

  fastify.register(fjwt, {
    secret: process.env.JWT_SECRET!
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
  // User routes
  // ---------------------------------------------------------------------------

  // Error messages for these are trash. Do I need Zod?

  const createUserSchema = {
    body: {
      type: 'object',
      required: ['username', 'email', 'password'],
      properties: {
        username: { type: 'string', minLength: 2 },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 }
      }
    }
  }

  const loginUserSchema = {
    body: {
      type: 'object',
      oneOf: [
        {
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', minLength: 2 },
            password: { type: 'string', minLength: 8 }
          }
        },
        {
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 }
          }
        }
      ]
    }
  }

  fastify.post('/user', { schema: createUserSchema }, createUser)
  fastify.post('/login', { schema: loginUserSchema }, loginUser)
  fastify.get('/test', testUser) // Absolutely just for testing

  fastify.post(
    '/blabs',
    {
      schema: {
        body: {
          type: 'object',
          required: ['content'],
          properties: {
            content: {
              type: 'string',
              minLength: 1,
              maxLength: 280
            }
          }
        }
      },
      onRequest: async (request) => {
        const verified = await request.jwtVerify()
        request.user = verified
      }
    },
    createBlab
  )

  fastify.get(
    '/blabs',
    {
      onRequest: async (request) => {
        const verified = await request.jwtVerify()
        request.user = verified
      }
    },
    getBlabs
  )

  fastify.get(
    '/blabs/mentioned',
    {
      onRequest: async (request) => {
        const verified = await request.jwtVerify()
        request.user = verified
      }
    },
    getMentionedBlabs
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
