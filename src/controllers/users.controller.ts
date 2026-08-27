import {
    setUserService,
    getUserService,
    updateUserService,
    deleteUserService,
    setUsuariosService
} from "../services/user.service"

export async function setUserController(req: any, res: any) {
    const respuesta = await setUserService(req)

    res.status(respuesta.status).send(respuesta.message)
}

export async function getListUsersController(req: any, res: any) {
    const listaUsuarios = await getUserService()
    res.status(listaUsuarios.status).send(listaUsuarios.message)
}


export async function updateUserController(req: any, res: any) {
    const updateU = await updateUserService(req)
    res.status(updateU.status).send(updateU.message)
}

export async function deleteUserController(req: any, res: any) {
    const deleteU= await deleteUserService(req)
    res.status(deleteU.status).send(deleteU.message)
}



export async function setUsuariosController(req: any, res: any) {
    const respuesta = await setUsuariosService(req)

    res.status(respuesta.status).send(respuesta.message)
}