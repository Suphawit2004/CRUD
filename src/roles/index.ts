import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import * as z from 'zod'
import { zValidator } from '@hono/zod-validator'
import db from '../db/index.js'

const roleRoutes = new Hono()

// roleRoutes.get('/', (c) => {
//   return c.json({ message: 'List of Role' })
// })

type roles = {
  id: number
  name: string
}
const createRolesSchema = z.object({
  name: z.string("กรุณากรอกชื่อตำแหน่ง"),
})

const updateRolesSchema = z.object({
  name: z.string().optional(),
})

roleRoutes.post('/',
  zValidator('json', createRolesSchema)
  , async (c) => {
    const body = await c.req.json<roles>()
    let sql = `INSERT INTO roles
      (name)
      VALUES(@name);
    `

    let stmt = db.prepare<Omit<roles,"id">>(sql)
    let result = stmt.run(body)

    if (result.changes === 0) {
      return c.json({ message: 'Failed to create roles' }, 500)
    }
    let lastRowid = result.lastInsertRowid as number

    let sql2 = 'SELECT * FROM roles WHERE id = ?'
    let stmt2 = db.prepare<[number], roles>(sql2)
    let newRoles = stmt2.get(lastRowid)

    return c.json({ message: 'Roles created', data: newRoles }, 201)
})

roleRoutes.get('/', async (c) => {

  let sql = 'SELECT * FROM roles'
  let stmt = db.prepare<[],roles>(sql)
  let roles : roles[] = stmt.all()

  return c.json({ message: 'List of roles' , data : roles})
})

roleRoutes.put('/:id', zValidator('json', updateRolesSchema),async (c) => {
    const id = Number(c.req.param('id'))
    const body = await c.req.json<{
      name?: string
    }>()

    const sql = `
      UPDATE roles SET
        name = COALESCE(@name, name)
      WHERE id = @id
    `
    const stmt = db.prepare(sql)
    const result = stmt.run({
      id,
      name: body.name ?? null,

    })
    if (result.changes === 0) {
      return c.json({ message: 'Role not found' }, 404)
    }

    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(id)
    return c.json(role)
  }
)
roleRoutes.delete('/:id', (c) => {
  const id = Number(c.req.param('id'))
  const result = db.prepare('DELETE FROM roles WHERE id = ?').run(id)

  if (result.changes === 0) {
    return c.json({ message: 'Role not found' }, 404)
  }

  return c.json({ message: 'Role deleted' })
})

export default roleRoutes ;