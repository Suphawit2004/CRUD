import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import * as z from 'zod'
import { zValidator } from '@hono/zod-validator'
import db from '../db/index.js'

const userRoutes = new Hono()


type User = {
  id: number
  username: string
  password: string
  firstname: string
  lastname: string
}

const createUserSchema = z.object({
  username: z.string("กรุณากรอกชื่อผู้ใช้")
      .min(5, "ชื่อต้องมีความยาวอย่างน้อย 5 ตัวอักษร"),
  password: z.string("กรุณากรอกรหัสผ่าน"),
  firstname: z.string("กรุณากรอกชื่อจริง").optional(),
  lastname: z.string("กรุณากรอกนามสกุล").optional(),

})

const updateUserSchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
})

userRoutes.post('/',
  zValidator('json', createUserSchema)
  , async (c) => {
    const body = await c.req.json<User>()
    let sql = `INSERT INTO user
      (username, password, firstname, lastname)
      VALUES(@username, @password, @firstname, @lastname);
    `

    let stmt = db.prepare<Omit<User,"id">>(sql)
    let result = stmt.run(body)

    if (result.changes === 0) {
      return c.json({ message: 'Failed to create user' }, 500)
    }
    let lastRowid = result.lastInsertRowid as number

    let sql2 = 'SELECT * FROM user WHERE id = ?'
    let stmt2 = db.prepare<[number], User>(sql2)
    let newUser = stmt2.get(lastRowid)

    return c.json({ message: 'User created', data: newUser }, 201)
})

userRoutes.get('/', async (c) => {

  let sql = 'SELECT * FROM user'
  let stmt = db.prepare<[],User>(sql)
  let user : User[] = stmt.all()

  return c.json({ message: 'List of users' , data : user})
})

userRoutes.get('/:id', (c) => {

  const { id } = c.req.param()
  let sql = 'SELECT * FROM user WHERE id = @id'
  let stmt = db.prepare<{id:string},User>(sql)
  let user  = stmt.get({id:id})

  if (!user) {
    return c.json({ message: 'User not found' }, 404)
  }

  return c.json({
    message: `User detail for ID: ${id}`, 
    data: user 
  })
})

userRoutes.put('/:id', zValidator('json', updateUserSchema),async (c) => {
    const id = Number(c.req.param('id'))
    const body = await c.req.json<{
      username?: string
      password?: string
      firstname?: string
      lastname?: string
    }>()

    const sql = `
      UPDATE user SET
        username = COALESCE(@username, username),
        password = COALESCE(@password, password),
        firstname = COALESCE(@firstname, firstname),
        lastname = COALESCE(@lastname, lastname)
      WHERE id = @id
    `
    const stmt = db.prepare(sql)
    const result = stmt.run({
      id,
      username: body.username ?? null,
      password: body.password ?? null,
      firstname: body.firstname ?? null,
      lastname: body.lastname ?? null,
    })
    if (result.changes === 0) {
      return c.json({ message: 'User not found' }, 404)
    }

    const user = db.prepare('SELECT * FROM user WHERE id = ?').get(id)
    return c.json(user)
  }
)


userRoutes.delete('/:id', (c) => {
  const id = Number(c.req.param('id'))
  const result = db.prepare('DELETE FROM user WHERE id = ?').run(id)

  if (result.changes === 0) {
    return c.json({ message: 'User not found' }, 404)
  }

  return c.json({ message: 'User deleted' })
})


// userRoutes.get('/:id', (c) => {
//   const { id } = c.req.param()

//   return c.json({ message: `User detail for ID: ${id}`, data: { id } })
// })

export default  userRoutes ;