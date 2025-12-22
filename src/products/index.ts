import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import * as z from 'zod'
import { zValidator } from '@hono/zod-validator'


const productRoutes = new Hono()

const createProductSchema = z.object({
  product_id: z.number( "ID ต้องเป็นตัวเลข")
       .int("ID ต้องเป็นจำนวนเต็มเท่านั้น (ห้ามมีจุดทศนิยม)") 
       .refine((num) => num.toString().length >= 5, "ID ต้องยาว 5 หลัก"),
  product_name: z.string("กรุณากรอกชื่อสินค้า").min(5, "ชื่อสินค้าต้องมีความยาวอย่างน้อย 5 ตัวอักษร"),
  
  product_price: z.number().refine((n) => n % 1 !== 0 ,{
    message: "เป็นทศนิยมเท่านั้น",
  }),
  product_cost: z.number().refine((n) => n % 1 !== 0 ,{
    message: "เป็นทศนิยมเท่านั้น",
  }),

  note: z.string().optional(),
})
productRoutes.get('/', (c) => {
  return c.json({ message: 'List of Products' })
})

productRoutes.post('/',    
    zValidator('json',createProductSchema)
    , async (c) => {
    const body = await c.req.json()
    return c.json({ message: 'Product created', data: body })
})

export default productRoutes ;
