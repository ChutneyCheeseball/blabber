import { FastifySchema } from 'fastify'

// I tried to use zod (with fastify-zod) for these schemas as I am more familiar with zod.

// There was an issue with legacy peer dependencies, and the zod validation
// refinements didn't seem to end up in the created JSON schema.

// Some of the validation errors are ugly as heck, but as zod refinements
// didn't work I didn't pursue a solution for this.

export const createUserSchema: FastifySchema = {
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

// Login with either username and password, or email and password
// but not both
export const loginUserSchema: FastifySchema = {
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

export const createBlabSchema: FastifySchema = {
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
}
