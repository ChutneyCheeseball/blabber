import { FastifyRequest, FastifyReply } from 'fastify'
import { Op } from 'sequelize'

interface BlabInput {
  content: string
}

export interface VerifiedUser {
  username: string
  email: string
  id: number
}

// -----------------------------------------------------------------------------
// Create a blab for the current user, allowing tagging/mentioning of
// other users (if they exist in the database)
// -----------------------------------------------------------------------------

export async function createBlab(
  request: FastifyRequest<{
    Body: BlabInput
  }>,
  reply: FastifyReply
) {
  const user = request.user as VerifiedUser
  const { id } = user
  const { content } = request.body

  try {
    const blab = await request.server.database.blabs.create({
      content,
      UserId: id
    })
    // Find tagged usernames
    const usernameMatches = content.match(/@(\w+)/g)
    if (usernameMatches) {
      const BlabId = blab.toJSON().id
      // Get usernames array without the starting '@'
      const usernames = usernameMatches.map((mention) => mention.slice(1))
      for (const u of usernames) {
        // Don't let narcissists tag themselves
        if (u === user.username) {
          continue
        }
        // Is the mentioned user even in the database?
        const mentionedUser = await request.server.database.users.findOne({ where: { username: u } })
        if (mentionedUser) {
          request.server.database.blabMentions.create({ BlabId, UserId: mentionedUser.toJSON().id })
        } else {
          console.log(`Mentioned unknown user "${u}"`)
        }
      }
    }
    reply.send('Blab created.')
  } catch (error) {
    console.error(error)
    reply.code(500).send('An error occurred')
  }
}

// -----------------------------------------------------------------------------
// Get all the blabs
// -----------------------------------------------------------------------------

export async function getAllBlabs(request: FastifyRequest, reply: FastifyReply) {
  try {
    const blabs = await request.server.database.blabs.findAll({
      order: [['createdAt', 'DESC']],
      attributes: ['content', 'createdAt'],
      include: [
        {
          model: request.server.database.users,
          attributes: ['username'],
          as: 'blabber'
        }
      ]
    })
    reply.send(blabs)
  } catch (error) {
    console.error(error)
    reply.code(500).send('An error occurred getting all blabs')
  }
}

// -----------------------------------------------------------------------------
// Get blabs that the current user was mentioned in
// -----------------------------------------------------------------------------

export async function getMentionedBlabs(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = request.user as VerifiedUser
    const mentionedBlabs = await request.server.database.blabs.findAll({
      attributes: ['content', 'createdAt'],
      include: [
        {
          model: request.server.database.blabMentions,
          where: { UserId: user.id },
          attributes: []
        },
        {
          model: request.server.database.users,
          as: 'blabber',
          attributes: ['username']
        }
      ],
      order: [['createdAt', 'DESC']]
    })
    reply.send(mentionedBlabs)
  } catch (error) {
    console.error(error)
    reply.code(500).send('An error occurred getting mentioned blabs')
  }
}

// -----------------------------------------------------------------------------
// Get current user's own blabs, as well as blabs they were mentioned in
// -----------------------------------------------------------------------------

export async function getTimelineBlabs(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = request.user as VerifiedUser
    const blabs = await request.server.database.blabs.findAll({
      attributes: ['content', 'createdAt'],
      include: [
        {
          model: request.server.database.blabMentions,
          attributes: []
        },
        {
          model: request.server.database.users,
          as: 'blabber',
          attributes: ['username']
        }
      ],
      where: {
        [Op.or]: [{ UserId: user.id }, { '$BlabMentions.UserId$': user.id }]
      },
      order: [['createdAt', 'DESC']]
    })
    reply.send(blabs)
  } catch (error) {
    console.error(error)
    reply.code(500).send('An error occurred getting timeline blabs')
  }
}
