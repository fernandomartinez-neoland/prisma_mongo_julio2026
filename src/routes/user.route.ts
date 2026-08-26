import express from 'express'
import { setUserController, getListUsersController, updateUserController } from '../controllers/users.controller';

const router=express.Router();


router.post('/setUser',setUserController)
router.get('/userList', getListUsersController)
router.patch('/updatetUser', updateUserController)



export default router