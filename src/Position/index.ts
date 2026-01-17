import { Hono } from 'hono'
import * as z from 'zod'
import { zValidator } from '@hono/zod-validator'

const positionRoutes = new Hono()

interface Position {
  PositionID: number;
  Title: string;
  Description: string;
  Level: string;
  CreatedDate: string;
}

let positions: Position[] = [
    {
        PositionID: 1,
        Title: "Software Engineer",
        Description: "Demo Position",
        Level: "Junior",
        CreatedDate: new Date().toISOString()
    }
];

const createPositionSchema = z.object({
  Title: z.string() .optional(),
  Description: z.string().optional(),
  Level: z.string().optional(),
})

positionRoutes.get('/', (c) => {
  return c.json({ message: 'List of Positions', data: positions })
})

positionRoutes.get('/:id', (c) => {
  const id = Number(c.req.param('id'));
  const position = positions.find(p => p.PositionID === id);

  if (!position) {
      return c.json({ message: 'Position not found' }, 404);
  }
  return c.json({ data: position }); // ปรับ format ให้เหมือน get all เล็กน้อย
});

positionRoutes.post('/',    
    zValidator('json', createPositionSchema),
    async (c) => {
    const body = await c.req.json()
    const newId = positions.length > 0 ? positions[positions.length - 1].PositionID + 1 : 1;

    const newPosition: Position = {
        PositionID: newId,
        Title: body.Title,
        Description: body.Description || "",
        Level: body.Level,
        CreatedDate: new Date().toISOString(),
    }

    positions.push(newPosition);
    return c.json({ message: 'Position created', data: newPosition }, 201)
})

positionRoutes.delete('/:id', (c) => {
  const id = Number(c.req.param('id'))
  const index = positions.findIndex(p => p.PositionID === id);

  if (index === -1) {
      return c.json({ message: 'Position not found' }, 404);
  }

  positions.splice(index, 1);
  return c.json({ message: `Position with ID ${id} deleted` })
})

export default positionRoutes;