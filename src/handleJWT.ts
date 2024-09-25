import { FastifyRequest, FastifyReply } from 'fastify'
import { VerifiedUser } from './blabs'

export const handleJWT = async (
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
