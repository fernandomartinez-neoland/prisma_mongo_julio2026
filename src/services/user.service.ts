import { db } from "../prisma/db"

export async function setUserService(req: any) {
    const { name, email, username } = req.body
    try {
        const usuario = await db.orm.users.create({ name, email, username })

        if (usuario) {
            return {
                status: 201,
                message: "Usuario creado"
            }
        } else {
            return {
                status: 403,
                message: "error al crear usuario"
            }
        }
    } catch (e) {
        return {
            status: 409,
            message: "usuario duplicado"
        }
    }
}

export async function getUserService() {
    try {
        const usuarios = await db.orm.users.all()
        if (usuarios) {
            return {
                status: 200,
                message: usuarios
            }
        } else {
            return {
                status: 403,
                message: "error cargar usuarios"
            }
        }
    } catch (e) {
        return {
            status: 409,
            message: "usuario duplicado"
        }
    }
}

export async function updateUserService(req: any) {
    const { id, name, username, email } = req.body
    try {
        const userU = await db.orm.users
            .where({ _id: id })
            .update({ name, username, email })

        if (userU) {
            return { status: 200, message: "Usuario actualizado" }
        } else {
            return { status: 404, message: "Usuario no encontrado" }
        }
    } catch (e) {
        return { status: 409, message: "error al actualizar usuario" }
    }
}


export async function deleteUserService(req: any) {
    const { id } = req.body
    try {
        const userU = await db.orm.users
            .where({ _id: id })
            .delete()

        if (userU) {
            return { status: 200, message: "Usuario eliminado" }
        } else {
            return { status: 404, message: "Usuario no encontrado" }
        }
    } catch (e) {
        return { status: 409, message: "error al eliminar usuario" }
    }
}

export async function setUsuariosService(req: any) {

    try {
        const usuario = await db.orm.users.createAll(req.body)

        if (usuario) {
            return {
                status: 201,
                message: "Usuario creado"
            }
        } else {
            return {
                status: 403,
                message: "error al crear usuario"
            }
        }
    } catch (e) {
        return {
            status: 409,
            message: "usuario duplicado"
        }
    }
}
