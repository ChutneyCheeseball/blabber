import { FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcrypt'

interface UserInput {
  email: string
  password: string
}

// -----------------------------------------------------------------------------
// Password hashing
// -----------------------------------------------------------------------------

function createHash(password: string) {
  return bcrypt.hashSync(password, 10)
}

function verifyHash(password: string, hash: string) {
  return bcrypt.compareSync(password, hash)
}

// -----------------------------------------------------------------------------
// Create user with given email address and password
// -----------------------------------------------------------------------------

export async function createUser(
  request: FastifyRequest<{
    Body: UserInput
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

// -----------------------------------------------------------------------------
// Login existing user and retrieve JWT
// -----------------------------------------------------------------------------

export async function loginUser(request: FastifyRequest<{ Body: UserInput }>, reply: FastifyReply) {
  const { email, password } = request.body
  const { users } = request.server.database
  try {
    const loginUser = await users.findOne({ where: { email } })
    if (!loginUser) {
      // Providing an explicit "not found" message to simplify my testing.
      // Don't provide this in a production environment.
      reply.code(404).send({ message: 'User not found.' })
      return
    }
    const userData = loginUser.toJSON()
    if (verifyHash(password, userData.password)) {
      const token = await reply.jwtSign({ email })
      reply.send({ token, message: 'Login successful.' })
    } else {
      reply.code(400).send({ message: 'Invalid email / password combo.' })
    }
  } catch (error) {
    console.error(error)
    reply.code(400).send({ message: 'An error occurred.' })
  }
}

// -----------------------------------------------------------------------------
// You definitely don't want anything like this EVER, but useful for my testing.
// -----------------------------------------------------------------------------

export async function testUser(request: FastifyRequest, reply: FastifyReply) {
  const verified = await request.jwtVerify()
  console.log(verified)
  // As a reward for using your token correctly, we show you everything.
  const users = await request.server.database.users.findAll()
  reply.send(users)
}
