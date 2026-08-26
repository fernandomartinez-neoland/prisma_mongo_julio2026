import { db } from "../prisma/db"

export async function setUserService(req: any) {
    const { name, email, username } = req.body
    try{
    const usuario = await db.orm.users.create({ name, email, username })
    console.log("respeusta")
    if(usuario){
        return{
            status:201,
            message:"Usuario creado"
        }
    }else{
        return{
            status:403,
            message:"error al crear usuario"
        }
    }
    }catch(e){
        return{
            status:409,
            message:"usuario duplicado"
        }
    }
}