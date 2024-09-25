import { FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcrypt'

interface UserInput {
  username?: string
  email?: string
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
  const { username, email, password } = request.body
  const { users } = request.server.database
  try {
    // Query username / email separately for specific reply messages
    // Check if username already exists
    const existingUser = await users.findOne({ where: { username } })
    if (existingUser) {
      reply.code(400).send('Username is already taken.')
      return
    }
    // Check if email already exists
    const existingEmail = await users.findOne({ where: { email } })
    if (existingEmail) {
      reply.code(400).send('Email address is already taken.')
      return
    }
    // Check if email already exists
    // Create new user with hashed password
    const hash = createHash(password)
    await users.create({
      username,
      email,
      password: hash
    })
    reply.send('User created.')
  } catch (error) {
    console.error(error)
    reply.code(400).send('Could not create user.')
  }
}

// -----------------------------------------------------------------------------
// Login existing user and retrieve JWT
// Users can log in with either their username or email, but not both
// -----------------------------------------------------------------------------

export async function loginUser(request: FastifyRequest<{ Body: UserInput }>, reply: FastifyReply) {
  try {
    const { username, email, password } = request.body
    const { users } = request.server.database
    const loginUser = await users.findOne(username ? { where: { username } } : { where: { email } })
    if (!loginUser) {
      // Providing an explicit "not found" message to simplify my testing.
      // Don't provide this in a production environment.
      reply.code(404).send('User not found.')
      return
    }
    const userData = loginUser.toJSON()
    if (verifyHash(password, userData.password)) {
      const token = await reply.jwtSign({
        email: userData.email,
        username: userData.username,
        id: userData.id
      })
      reply.send(token)
    } else {
      reply.code(400).send('Invalid credentials.')
    }
  } catch (error) {
    console.error(error)
    reply.code(500).send('An error occurred.')
  }
}
