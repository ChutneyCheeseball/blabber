# Blabber - A Twitter Clone

- This project was created from scratch without any initialization tools.
- The core frameworks behind the project are `Fastify` and `Sequelize`.
- I have no prior experience with them, so this was much more of a learning exercise than applying what I already know.
- My development machine is running Linux Mint, but the project should run anywhere.

## Getting Started

### Starting the database

- The MySQL database is started from a docker image.
- Database options are defined in `docker-compose.yml` - note that they must match the environment variables in `.env`
- `Adminer` is run alongside MySQL as a convenient visual tool for checking the database.
- The database is not seeded, `Sequelize` will create tables as needed on start.

Run both images with: \
`docker compose up`

### Building the project

Transpile the TypeScript to JavaScript with: \
`npm run build`

### Running the build

Run transpiled code with: \
`npm start`

### Start development server

Use `ts-node-dev` to transpile when files change: \
` npm run dev`

## Accessing Endpoints

The project runs at `http://127.0.0.1:3000`, this is not configurable without changing the code. \
I did not pursue any attempt to run this securely over `https`.

_Many endpoints return plain text responses, which for the most part are simple success or error messages._

The Blab endpoints return JSON arrays on success.

---

### Create user endpoint

Creates a user with specified properties in the database.

**POST** http://127.0.0.1:3000/user

**Example payload:**

```
{
    "username": "JoeNobody",
    "email": "joenobody@email.com",
    "password": "pass1234"
}
```

**Example response:**

```
200 OK

User created.
```

---

### User login endpoint

Provides a plain text JWT on successful login.

**POST** http://127.0.0.1:3000/login

**Example payload 1 (username login):**

```
{
    "username": "JoeNobody",
    "password": "pass1234"
}
```

**Example payload 2 (email login):**

```
{
    "email": "joenobody@email.com",
    "password": "pass1234"
}
```

**Example response:**

```
200 OK

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImpvZUBtYWlsc2VydmVyLmNvbSIsInVzZXJuYW1lIjoiSm9lTm9ib2R5IiwiaWQiOjIsImlhdCI6MTcyNzI2Nzc2MH0.R45uwdEKRFN_YxqsnQGuB6V6Zb-GZeht1-7wCsKCHCA
```

---

### Create Blab endpoint

Creates a Blab with specified content. Allows tagging of users with @username.\
Requires JWT in authorization bearer headers.

**POST** http://127.0.0.1:3000/blabs

**Example payload:**

```
{
    "content": "Where is @ChickenMcNugget?"
}
```

**Example response:**

```
200 OK

Blab created.
```

---

### Feed endpoint

Returns all Blabs.\
Requires JWT in authorization bearer headers.

**GET http://127.0.0.1:3000/feed**

**Example response:**

```
200 OK

[
    {
        "content": "Where are my car keys?",
        "createdAt": "2024-09-25T14:13:10.000Z",
        "blabber": {
            "username": "ChickenMcNugget"
        }
    },
    {
        "content": "Hello @JoeNobody",
        "createdAt": "2024-09-25T12:10:10.000Z",
        "blabber": {
            "username": "ChickenMcNugget"
        }
    },
    {
        "content": "@ChickenMcNugget are you alive?",
        "createdAt": "2024-09-25T11:58:59.000Z",
        "blabber": {
            "username": "JoeNobody"
        }
    },
    {
        "content": "How are you?",
        "createdAt": "2024-09-25T11:51:43.000Z",
        "blabber": {
            "username": "JoeNobody"
        }
    },
    {
        "content": "Hello there!",
        "createdAt": "2024-09-25T11:51:09.000Z",
        "blabber": {
            "username": "JoeNobody"
        }
    }
]
```

---

### Mentioned Blabs

Gets all Blabs in which the current user was tagged/mentioned.\
Requires JWT in authorization bearer headers.

**GET http://127.0.0.1:3000/mentioned**

**Example response:**

```
200 OK

[
    {
        "content": "Hello @JoeNobody",
        "createdAt": "2024-09-25T12:10:10.000Z",
        "blabber": {
            "username": "ChickenMcNugget"
        }
    }
]
```

---

### Timeline Blabs

Gets all Blabs by the current user, as well as Blabs in which they were tagged/mentioned.\
Requires JWT in authorization bearer headers.

**GET http://127.0.0.1:3000/timeline**

**Example response:**

```
200 OK

[
    {
        "content": "Hello @JoeNobody",
        "createdAt": "2024-09-25T12:10:10.000Z",
        "blabber": {
            "username": "ChickenMcNugget"
        }
    },
    {
        "content": "@ChickenMcNugget are you alive?",
        "createdAt": "2024-09-25T11:58:59.000Z",
        "blabber": {
            "username": "JoeNobody"
        }
    },
    {
        "content": "How are you?",
        "createdAt": "2024-09-25T11:51:43.000Z",
        "blabber": {
            "username": "JoeNobody"
        }
    },
    {
        "content": "Hello there!",
        "createdAt": "2024-09-25T11:51:09.000Z",
        "blabber": {
            "username": "JoeNobody"
        }
    }
]
```

## Using Postman

A public 'Blabber' workspace is available here: https://www.postman.com/chutneycheeseball/blabber/ \
Note that the desktop agent is required for CORS issues and such.

There are two collections, **Users** and **Blabs**.

For your convenience, the Login requests automatically set/clear a global variable `jwToken` which is used by the Blabs collection as their authorization bearer token.
