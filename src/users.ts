import { FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcrypt'

interface CreateUserInput {
  email: string
  password: string
}

function createHash(password: string) {
  // Note: the salt is stored alongside the hash
  return bcrypt.hashSync(password, 10)
}

export async function createUser(
  request: FastifyRequest<{
    Body: CreateUserInput
  }>,
  reply: FastifyReply
) {
  const { email, password } = request.body
  const { users } = request.server.database
  try {
    // Check if user already exists
    const existingUser = await users.findOne({ where: { email } })
    if (existingUser) {
      reply.code(400).send('Email address is already taken.')
    } else {
      // Create new user with hashed password
      const hash = createHash(password)
      await users.create({
        email,
        password: hash
      })
      reply.send('User created.')
    }
  } catch (error) {
    console.error(error)
    reply.code(400).send('Could not create user.')
  }
}
