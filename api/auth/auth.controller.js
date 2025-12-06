import { loggerService } from '../../services/logger.service.js'
import { usersService } from '../user/users.service.js'
import { authService } from './auth.service.js'
import bcrypt from 'bcrypt'

export async function registerUser(req,res){
    const {
        username,
        password, 
        fullname, 
        imgUrl='https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
    } = req.body
    
    try {
        if(!username || !password || !fullname) throw new Error('Missing required fields: username, password, fullname')
        const user= {
            ...usersService.getEmptyUser(),
            username, 
            password,
            fullname, 
            imgUrl
        }
        const addedUser = await usersService.save(user)
        res.send(addedUser)
        loggerService.info(`User ${addedUser._id} registered successfully`)
    }
    catch (err) {
        loggerService.error('Cannot register user', err)
        res.status(400).send({ err: 'Cannot register user' })
    }
}

export async function loginUser(req, res) {
    const { username, password } = req.body
    console.log(req.body)
    if (!username) {
        res.status(400).send('username and password are required!')
        return
    }
    try {
        const user = await usersService.login(username, password)
        loggerService.info('User login: ', user)
        
        const loginToken = authService.getLoginToken(user)
        res.cookie('loginToken', loginToken, { sameSite: 'None', secure: true })
        const fulluser = await usersService.getById(user._id)
        res.json(fulluser)
    } catch (err) {
        loggerService.error('Cannot login user', err)
        res.status(400).send('Cannot login user')
    }
}

export async function logoutUser(req, res) {
    try {
        res.clearCookie('loginToken')
        res.send({ msg: 'Logged out successfully' })
    } catch (err) {
        loggerService.error('Cannot logout user', err)
        res.status(400).send('Cannot logout user')
    }
}