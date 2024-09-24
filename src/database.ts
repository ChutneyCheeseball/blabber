import { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { DataTypes, Sequelize } from 'sequelize'

interface dbOptions {
  database: string
  user: string
  password: string
  host: string
}

function db(fastify: FastifyInstance, opts: dbOptions, done: (error?: Error) => void) {
  // Init db instance
  const sequelize = new Sequelize(opts.database, opts.user, opts.password, {
    host: opts.host,
    dialect: 'mysql'
  })

  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    }
  })

  const Blab = sequelize.define('Blab', {
    content: {
      type: DataTypes.STRING(280),
      allowNull: false
    }
  })

  const BlabMention = sequelize.define('BlabMention', {})

  User.hasMany(Blab)
  Blab.belongsTo(User, { foreignKey: 'userId', as: 'blabber' })

  Blab.hasMany(BlabMention, { foreignKey: 'blabId' })
  BlabMention.belongsTo(Blab, { foreignKey: 'blabId' })
  BlabMention.belongsTo(User, { foreignKey: 'userId' })
  User.hasMany(BlabMention, { foreignKey: 'userId' })

  // ---------------------------------------------------------------------------
  // Test our database connection - if good: add hooks, decorators, do sync
  // Otherwise, let Fastify know to give up
  // ---------------------------------------------------------------------------

  sequelize
    .authenticate()
    // All good
    .then(() => {
      console.log('DB connection is good')
      // Make models available to Fastify instance
      fastify.decorate('database', { users: User, blabs: Blab, blabMentions: BlabMention })
      // Close db on Fastify shutdown
      fastify.addHook('onClose', (_, done) => {
        console.log('DB shutting down...')
        sequelize.close().finally(() => done())
      })
      sequelize.sync().then(() => {
        console.log('DB sync complete')
        done()
      })
    })
    // Could not connect to db
    .catch((error) => {
      console.error(error)
      done(new Error('DB connection failed.'))
    })
}

// Looks like we have to do this in order to preserve context, i.e. not lose our decorators
export const database = fastifyPlugin(db, {
  fastify: '5.x'
})
