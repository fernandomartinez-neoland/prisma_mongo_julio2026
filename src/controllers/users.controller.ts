import { setUserService } from "../services/user.service"
export async function setUserController(req: any, res: any) {
    const respuesta = await setUserService(req)

    res.status(respuesta.status).send(respuesta.message)
}