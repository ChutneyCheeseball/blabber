import dotenv from 'dotenv'
import Fastify from 'fastify'
import { database } from './database'
import { createUser, loginUser } from './users'
import { createBlab, getAllBlabs, getMentionedBlabs, getTimelineBlabs } from './blabs'
import fjwt from 'fastify-jwt'
import { handleJWT } from './handleJWT'
import { createBlabSchema, createUserSchema, loginUserSchema } from './schema'

// Load our environment variables
dotenv.config()

// =============================================================================
// Main Application
// =============================================================================

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

  fastify.post('/user', { schema: createUserSchema }, createUser)
  fastify.post('/login', { schema: loginUserSchema }, loginUser)
  // Previously had a test endpoint to list all users but removed it as I
  // didn't want to implement admin user functionality.

  // ---------------------------------------------------------------------------
  // Blab routes (protected)
  // ---------------------------------------------------------------------------

  // In hindsight, all the blab routes could have been their own plugin
  // so we don't have to pass the onRequest handler multiple times.
  // This would also allow convenient prefixing of all the blab routes.

  // Create a blab
  fastify.post('/blabs', { schema: createBlabSchema, onRequest: handleJWT }, createBlab)

  // Get all blabs
  fastify.get('/feed', { onRequest: handleJWT }, getAllBlabs)

  // Only get blabs in which user is mentioned
  fastify.get('/mentioned', { onRequest: handleJWT }, getMentionedBlabs)

  // Get user's own blabs and blabs in which they are mentioned
  fastify.get('/timeline', { onRequest: handleJWT }, getTimelineBlabs)

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
