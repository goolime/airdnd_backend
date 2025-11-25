//import { utilService } from './util.service.js'
import { loggerService } from "../../services/logger.service.js"
import { makeId, readJsonFile, writeJsonFile } from '../../services/utils.js'
import bcrypt from 'bcrypt'
import { dbService } from "../../services/db.service.js";
import { ObjectId } from 'mongodb';
import { propertyService } from "../property/property.service.js";

const COLLECTION_NAME = 'airbnb_users'
const saltRounds = 10;

//const DATA_PATH = './data/user.json'

//const users = readJsonFile(DATA_PATH)

export const usersService = {
    getById,
    remove,
    save,
    removePropertyFromHost,
    setNewPropertyToHost,
    getMiniUserById,
    login
}

async function getById(userId) {
    try {
        console.log('Getting user by id:', userId);
        const criteria={_id: ObjectId.createFromHexString(userId.toString())}
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const user = await collection.findOne(criteria)
        console.log('User found:', user);
        if (!user) throw new Error(`User with id ${userId} not found!`)
        delete user.password;
        return await _prepUser(user)  
    } catch (err) {
        console.log('Error getting user by id:', err);
        console.log(err.stack);
        loggerService.error('Cannot get user by id', err)
        throw err
    }
    /*
    const user = {...users.find(user => user._id === userId)}
    if (!user) throw new Error(`User with id ${userId} not found!`)
    delete user.password;
    return user
    */
}

async function remove(userId) {
    try {
        const criteria={_id: ObjectId.createFromHexString(userId)}
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const deleteResult = await collection.deleteOne(criteria)
        if (deleteResult.deletedCount === 0) throw new Error(`User with id ${userId} not found!`)
        loggerService.debug(`UserService - remove: ${userId} removed`)
        return;
    } catch (err) {
        loggerService.error('Cannot remove user', err)
        throw err
    }
    /*
    const idx = users.findIndex(user => user._id === userId)
    if (idx === -1) throw new Error(`User with id ${userId} not found!`)
    const userProperties = [...users[idx].properties]
    users.splice(idx, 1)
    writeJsonFile(DATA_PATH, users)
    return userProperties;
    */
}

async function save(user) {
    //var changedUser = {};
    try{
        const collection = await dbService.getCollection(COLLECTION_NAME)
        if (user._id) {
            const criteria={_id: ObjectId.createFromHexString(user._id)}
            const updateData = {$set: {}}
            for (const key in user) {
                if (key !== '_id' && key !== 'password') {
                    updateData.$set[key] = user[key]
                }
            }
            if (user.password) {
                updateData.$set.password = await bcrypt.hashSync(user.password, saltRounds)
            }
            const result = await collection.updateOne(criteria, updateData)
            if (result.matchedCount === 0) throw new Error(`User with id ${user._id} not found!`)
            const changedUser = await collection.findOne(criteria)
            loggerService.debug(`UserService - update: ${user._id} updated`)
            return changedUser
    
        }
        else {
            const newUser = {
                fullname: user.fullname,
                imgUrl: user.imgUrl,
                username: user.username,
                password: await bcrypt.hashSync(user.password, saltRounds),
                properties: []
            }
            const insertResult = await collection.insertOne(newUser)
            newUser._id = insertResult.insertedId
            loggerService.debug(`UserService - add: ${newUser._id} added`)
            return newUser
        }
    } catch (err) {
        loggerService.error('Cannot save user', err)
        throw err
    }
    /*
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
    */
}

async function removePropertyFromHost(propertyId, ownerId) {
    const user = await getById(ownerId)
    user.properties = user.properties.filter(propId => propId !== propertyId)
    await save(user)
}


async function setNewPropertyToHost(propertyId, ownerId) {
    const user = await getById(ownerId)
    user.properties.push(propertyId)
    await save(user)
}

async function getMiniUserById(userId) {
    const user = await getById(userId)
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
    try{
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const criteria={username}
        const user = await collection.findOne(criteria)
        if (!user) throw new Error(`User with username ${username} not found!`)
        const match = await bcrypt.compare(password, user.password)
        //const userToReturn = getById(user._id)
        delete user.password
        delete user.properties
        delete user.imgUrl
        return match ? user : null
    }    catch (err) {
        loggerService.error('Cannot login user', err)
        throw err
    }
}

async function _prepUser(user) {
    return {
        _id: user._id,
        fullname: user.fullname,
        imgUrl: user.imgUrl,
        username: user.username,
        properties: await propertyService.getPropertiesByUserId(user._id.toString())
    }
}
