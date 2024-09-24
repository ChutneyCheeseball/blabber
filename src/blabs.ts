import { FastifyRequest, FastifyReply } from 'fastify'

interface BlabInput {
  content: string
}

export async function createBlab(
  request: FastifyRequest<{
    Body: BlabInput
  }>,
  reply: FastifyReply
) {
  // We are not submitting username, but we stored it as part of JWT handling
  const user = request.user as { username: string; email: string }
  const dbUser = await request.server.database.users.findOne({ where: { username: user.username } })
  if (dbUser) {
    const { id } = dbUser.toJSON() // Get primary key
    request.server.database.blabs.create({
      content: request.body.content,
      UserId: id
    })
    reply.send({ message: 'Thanks for the GARBAGE' })
  } else {
    reply.code(400).send({ message: 'Unknown user' })
  }
}

export async function getBlabs(request: FastifyRequest, reply: FastifyReply) {
  // Get blabs and their blabber
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
}

export async function getMentionedBlabs(request: FastifyRequest, reply: FastifyReply) {
  const mentionedBlabs = await request.server.database.blabMentions.findAll({
    where: { userId: 2 },
    attributes: [],
    include: [
      {
        model: request.server.database.blabs,
        as: 'Blab',
        attributes: ['content', 'createdAt'],
        include: [
          {
            model: request.server.database.users,
            as: 'blabber',
            attributes: ['username']
          }
        ]
      }
    ],
    order: [[{ model: request.server.database.blabs, as: 'Blab' }, 'createdAt', 'DESC']]
  })
  reply.send(mentionedBlabs)
}
