import express from 'express'
import { 
    setUserController, 
    getListUsersController, 
    updateUserController,
    deleteUserController,
    setUsuariosController
} from '../controllers/users.controller';

const router=express.Router();


router.post('/setUser',setUserController)
router.get('/userList', getListUsersController)
router.patch('/updatetUser', updateUserController)
router.delete('/deleteUser', deleteUserController)
router.post('/crearMuchos', setUsuariosController)



export default router