import { loggerService } from "../../services/logger.service.js"
import { makeId, readJsonFile, writeJsonFile } from '../../services/utils.js'
import bcrypt from 'bcrypt'
import { dbService } from "../../services/db.service.js";
import { ObjectId } from 'mongodb';
import { propertyService } from "../property/property.service.js";

const COLLECTION_NAME = 'airbnb_users'
const saltRounds = 10;

export const usersService = {
    getById,
    remove,
    save,
    removePropertyFromHost,
    getMiniUserById,
    login,
    getEmptyUser,
    addToWishlist,
    removeFromWishlist
}

async function getById(userId) {
    try {
        const criteria={_id: ObjectId.createFromHexString(userId.toString())}
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const user = await collection.findOne(criteria)
        if (!user) throw new Error(`User with id ${userId} not found!`)
        delete user.password;
        return await _prepUser(user)  
    } catch (err) {
        loggerService.error('Cannot get user by id', err)
        throw err
    }
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
                updateData.$set.password = await bcrypt.hash(user.password, saltRounds)
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
                password: await bcrypt.hash(user.password, saltRounds),
                properties: []
            }
            const insertResult = await collection.insertOne(newUser)
            newUser._id = insertResult.insertedId
            loggerService.debug(`UserService - add: ${newUser._id} added`)
            delete newUser.password
            return newUser
        }
    } catch (err) {
        loggerService.error('Cannot save user', err)
        throw err
    }
}

async function removePropertyFromHost(propertyId, ownerId) {
    const user = await getById(ownerId)
    user.properties = user.properties.filter(propId => propId !== propertyId)
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

export function getEmptyUser(fullname = '', imgUrl = '', username = '', wishlist = []) {
    return { fullname, imgUrl, username, wishlist }
}

async function login(username, password) {
    try{
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const criteria={username}       
        const user = await collection.findOne(criteria)
        if (!user) throw new Error(`User with username ${username} not found!`)
        const match = await bcrypt.compare(password, user.password)
        if (!match) throw new Error('Invalid password')
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

async function addToWishlist(userId, propertyId) {
    try {
        const user = await getById(userId)
        if (!user) throw new Error(`User with id ${userId} not found!`)
        if (!user.wishlist) user.wishlist = []
        if (!user.wishlist.includes(propertyId)) {
            user.wishlist.push(propertyId)
            const collection = await dbService.getCollection(COLLECTION_NAME)
            const criteria={_id: ObjectId.createFromHexString(userId)}
            const updateData = {$set: {wishlist: user.wishlist}}
            await collection.updateOne(criteria, updateData)
        }
        return user
    } catch (err) {
        loggerService.error('Cannot add to wishlist', err)
        throw err
    }
}

async function removeFromWishlist(userId, propertyId) {
    try {
        const user = await getById(userId)
        if (!user) throw new Error(`User with id ${userId} not found!`)
        if (user.wishlist && user.wishlist.includes(propertyId)) {
            user.wishlist = user.wishlist.filter(id => id !== propertyId)
            const collection = await dbService.getCollection(COLLECTION_NAME)
            const criteria={_id: ObjectId.createFromHexString(userId)}
            const updateData = {$set: {wishlist: user.wishlist}}
            await collection.updateOne(criteria, updateData)
        }
        return user
    } catch (err) { 
        loggerService.error('Cannot remove from wishlist', err)
        throw err
    }   
}