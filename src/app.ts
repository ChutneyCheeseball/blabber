import dotenv from 'dotenv'
import Fastify, { FastifyReply, FastifyRequest } from 'fastify'
import { database } from './database'
import { createUser, loginUser } from './users'
import { createBlab, getAllBlabs, getMentionedBlabs, getTimelineBlabs, VerifiedUser } from './blabs'
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

  // ---------------------------------------------------------------------------
  // Blab routes (protected)
  // ---------------------------------------------------------------------------

  const handleJWT = async (
    request: FastifyRequest<{
      Body: unknown
    }>,
    reply: FastifyReply
  ) => {
    try {
      const verifiedUser = (await request.jwtVerify()) as VerifiedUser
      // Does this token belong to an actual user in the database?
      try {
        const dbUser = await request.server.database.users.findByPk(verifiedUser.id)
        if (!dbUser) {
          console.log("Token doesn't belong to a db user")
          reply.code(400).send('Unknown user')
        }
        // Attach to request for handler's convenience
        request.user = verifiedUser
      } catch (error) {
        console.error(error)
        reply.code(500).send('Database error')
      }
    } catch (error) {
      console.error(error)
      reply.code(400).send('Authentication error')
    }
  }

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
      onRequest: handleJWT
    },
    createBlab
  )

  // Get all blabs
  fastify.get(
    '/feed',
    {
      onRequest: handleJWT
    },
    getAllBlabs
  )

  // Only get blabs in which user is mentioned
  fastify.get(
    '/mentioned',
    {
      onRequest: handleJWT
    },
    getMentionedBlabs
  )

  // Get user's own blabs and blabs in which they are mentioned
  fastify.get(
    '/timeline',
    {
      onRequest: handleJWT
    },
    getTimelineBlabs
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
