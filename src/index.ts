import Fastify from 'fastify'

const fastify = Fastify()

fastify.get('/', async (request, reply) => {
  return 'Hello world!\n'
})

fastify.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})
