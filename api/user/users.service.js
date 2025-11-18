//import { utilService } from './util.service.js'
import { loggerService } from "../../services/logger.service.js"
import { makeId, readJsonFile, writeJsonFile } from '../../services/utils.js'
import bcrypt from 'bcrypt'

const saltRounds = 10;

const DATA_PATH = './data/user.json'

const users = readJsonFile(DATA_PATH)

export const usersService = {
    getById,
    remove,
    save,
    removePropertyFromHost,
    setNewPropertyToHost,
    getMiniUserById,
    login
}

function getById(userId) {
    const user = {...users.find(user => user._id === userId)}
    if (!user) throw new Error(`User with id ${userId} not found!`)
    delete user.password;
    return user
}

function remove(userId) {
    const idx = users.findIndex(user => user._id === userId)
    if (idx === -1) throw new Error(`User with id ${userId} not found!`)
    const userProperties = [...users[idx].properties]
    users.splice(idx, 1)
    writeJsonFile(DATA_PATH, users)
    return userProperties;
}

async function save(user) {
    var changedUser = {};
    if (user._id) {
        const idx = users.findIndex(u => u._id === user._id)
        if (idx === -1) throw new Error(`User with id ${user._id} not found!`)
        console.log('UserService - update user before change:', users[idx]);
        changedUser = {...users[idx], ...user}
        users[idx] = changedUser
        console.log('UserService - update:', users[idx]);
        console.log('UserService - update user properties:', changedUser.properties);
        loggerService.debug(`UserService - update: ${user._id} updated`)
    } else {
        user._id = makeId()
        changedUser = {...user, password: await bcrypt.hashSync(user.password, saltRounds)}
        users.push(changedUser)
        loggerService.debug(`UserService - add: ${user._id} added`)
    }   
    writeJsonFile(DATA_PATH, users)
    return changedUser;
}

function removePropertyFromHost(propertyId, ownerId) {
    const user = getById(ownerId)
    user.properties = user.properties.filter(propId => propId !== propertyId)
    save(user)
}


function setNewPropertyToHost(propertyId, ownerId) {
    const user = getById(ownerId)
    user.properties.push(propertyId)
    save(user)
}

function getMiniUserById(userId) {
    const user = getById(userId)
    return {
        _id: user._id,
        fullname: user.fullname,
        imgUrl: user.imgUrl
    }
}

export function getEmptyUser(fullname = '', imgUrl = '', username = '', properties = []) {
    return { fullname, imgUrl, username, properties }
}

async function login(username, password) {
    const user = users.find(user => user.username === username)
    if (!user) throw new Error(`User with username ${username} not found!`)
    const match = await bcrypt.compare(password, user.password)
    const userToReturn = getById(user._id)
    delete userToReturn.properties
    delete userToReturn.imgUrl
    return match ? userToReturn : null
}
