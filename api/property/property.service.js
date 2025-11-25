import { loggerService } from '../../services/logger.service.js'
//import { makeId, readJsonFile, writeJsonFile, reduceList } from '../../services/utils.js'
import { reduceList } from '../../services/utils.js'
import { ordersService } from '../order/orders.services.js'

import { dbService } from '../../services/db.service.js'
import { ObjectId } from 'mongodb'
//const DATA_PATH = './data/property.json'

//const properties = readJsonFile(DATA_PATH)
const COLLECTION_NAME = 'airbnb_properties'

export const propertyService = {
    query,
    getById,
    remove,
    save,
    getPropertiesByCity,
    getPropertiesByUserId
}

async function query(filterBy,orderBy = { field: 'name', direction: 1 }) { 
    try{
    const criteria = {}
    // Build criteria based on filterBy
    console.log('filterBy in service:', filterBy);
    for (const field in filterBy) {
        switch (field) {
            case 'type':
                if (filterBy.type !== 'any' && filterBy.type !== 'room' && filterBy.type !== 'home') continue
                else if (filterBy.type === 'room') criteria.type = { $in: ['Guesthouse', 'Hotel'] }
                else if (filterBy.type === 'home') criteria.type = { $in: ['House', 'Apartment'] }
                break
            case 'types':
            case 'amenities':
            case 'accessibility':
            case 'labels':
            case 'rules':
                criteria[field] = { $all: filterBy[field] } 
                break
            case 'minPrice':
                if (filterBy.minPrice > filterBy?.maxPrice) throw new Error('minPrice cannot be greater than maxPrice')
                criteria.price = { ...criteria.price, $gte: filterBy.minPrice }
                break
            case 'maxPrice':
                if (filterBy.maxPrice <= 0) throw new Error('maxPrice must be greater than 0')
                criteria.price = { ...criteria.price, $lte: filterBy.maxPrice }
                break   
            case 'bedrooms':
            case 'beds':
            case 'bathrooms':
                criteria[field] = { $gte: filterBy[field] }
                break
            case 'guests':
                for (const guestType in filterBy.guests) {
                    criteria[`capacity.${guestType}`] = { $gte: filterBy.guests[guestType] }
                }
                break
            case 'loc':
                criteria['loc.lat'] = { $gte: filterBy.loc.minLat, $lte: filterBy.loc.maxLat }
                criteria['loc.lng'] = { $gte: filterBy.loc.minLng, $lte: filterBy.loc.maxLng }
                break
            case 'raiting':
            case 'dates':
                // Handled after fetching properties
                break
            default:
                console.log('Unknown filter field:', field);
        }   
    }
    console.log('criteria:', criteria);
    const collection = await dbService.getCollection(COLLECTION_NAME)
    const properties= await collection.find(criteria).toArray()
    let filteredProperties = properties.filter(property => ordersService.isPropertyAvailable(property._id, filterBy.dates.from, filterBy.dates.to))
    filteredProperties.sort((a,b) => {
        if(a[orderBy.field] < b[orderBy.field]) return -1 * orderBy.direction;
        if(a[orderBy.field] > b[orderBy.field]) return 1 * orderBy.direction;
        return 0;
    })
    return filteredProperties
    } catch (err) {
        loggerService.error('Cannot query properties', err)
        throw err
    }
    /*
    const filteredProperties = properties.filter(property => {
        for (const field in filterBy) {
            switch (field) {
                case 'type':
                    if (filterBy.type !== 'any' && filterBy.type !== 'room' && filterBy.type !== 'home') return false
                    else if (filterBy.type === 'room' && (property.type !== 'Guesthouse' && property.type !== 'Hotel')) return false
                    else if (filterBy.type === 'home' && (property.type !== 'House' && property.type !== 'Apartment')) return false
                    else continue
                case 'types':
                case 'amenities':
                case 'accessibility':
                case 'labels':
                case 'rules':
                    for (const val of filterBy[field]) {
                        if (!property[field].includes(val)) return false
                    }
                    break
                case 'minPrice':
                    if (property.price < filterBy.minPrice) return false
                    break
                case 'maxPrice':
                    if (filterBy.maxPrice > 0 && property.price > filterBy.maxPrice) return false
                    break
                case 'bedrooms':
                case 'beds':
                case 'raiting':
                case 'bathrooms':
                    if (property[field] < filterBy[field]) return false
                    break
                case 'guests':
                    for (const guestType in filterBy.guests) {
                        if (property.capacity[guestType] < filterBy.guests[guestType]) return false
                    }
                    break
                case 'loc':
                    if(
                        property.loc.lat < filterBy.loc.minLat ||
                        property.loc.lat > filterBy.loc.maxLat ||
                        property.loc.lng < filterBy.loc.minLng ||
                        property.loc.lng > filterBy.loc.maxLng) return false
                    break
                case 'dates':
                    if (!ordersService.isPropertyAvailable(property._id, filterBy.dates.from, filterBy.dates.to)) return false
                    break
                default:
                    console.log('Unknown filter field:', field);
                    return false;
            }
        }
        return true;
    }
    )
    filteredProperties.sort((a,b) => {
        if(a[orderBy.field] < b[orderBy.field]) return -1 * orderBy.direction;
        if(a[orderBy.field] > b[orderBy.field]) return 1 * orderBy.direction;
        return 0;
    })
    loggerService.debug(`PropertyService - query with filterBy: ${JSON.stringify(filterBy)} \n returned ${filteredProperties.length} properties`)
    return filteredProperties;
    */
}


async function getById(propertyId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const criteria={_id: ObjectId.createFromHexString(propertyId)}
        const property = await collection.findOne(criteria)
        if (!property) throw new Error(`Property with id ${propertyId} not found`)
        loggerService.debug(`PropertyService - getById: ${propertyId} found`)
        return property;
        /*
        const property = properties.find(property => property._id === propertyId)
        if (!property) throw new Error(`Property with id ${propertyId} not found`)
        loggerService.debug(`PropertyService - getById: ${propertyId} found`)
        return property
        */
    } catch (err) {
        loggerService.error(`PropertyService - getById(${propertyId}) failed`, err)
        throw err
    }
}

async function remove(propertyId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const criteria={_id: new ObjectId(propertyId)}
        const deleteResult = await collection.deleteOne(criteria)
        if (deleteResult.deletedCount === 0) throw new Error(`Property with id ${propertyId} not found`)
        loggerService.debug(`PropertyService - remove: ${propertyId} removed`)
        return propertyId;
    } catch (err) {
        loggerService.error('Cannot remove property', err)
        throw err
    }
    /*
    const idx = properties.findIndex(property => property._id === propertyId)
    if (idx === -1)  throw new Error(`Property with id ${propertyId} not found`)
    const ownerId = properties[idx].ownerId
    properties.splice(idx, 1)
    writeJsonFile(DATA_PATH, properties)
    loggerService.debug(`PropertyService - remove: ${propertyId} removed`)
    return ownerId;
    */
}

async function save(property) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        if (property._id) {
            const criteria={_id: new ObjectId(property._id)}
            const updateResult = await collection.replaceOne(criteria, property)
            if (updateResult.matchedCount === 0) throw new Error(`Property with id ${property._id} not found`)
            loggerService.debug(`PropertyService - update: ${property._id} updated`)
            return await collection.findOne(criteria)
            /*
            const idx = properties.findIndex(p => p._id === property._id)
            if (idx === -1) throw new Error(`Property with id ${property._id} not found`)
            properties[idx] = property
            loggerService.debug(`PropertyService - update: ${property._id} updated`)
            */
        } else {
            const insertResult = await collection.insertOne(property)
            property._id = insertResult.insertedId
            loggerService.debug(`PropertyService - add: ${property._id} added`)
            return property;
            /*
            property._id = makeId()
            properties.push(property)
            loggerService.debug(`PropertyService - add: ${property._id} added`)
            */
        }
        //writeJsonFile(DATA_PATH, properties)
        //return property;    
    } catch (err) {
        loggerService.error('Cannot save property', err)
        throw err
    }
}

async function getPropertiesByCity(city) {
    try{
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const criteria = {
            "loc.lat": { $gte: city.minLat, $lte: city.maxLat },
            "loc.lng": { $gte: city.minLng, $lte: city.maxLng }
        }
        const filteredProperties = await collection.find(criteria).toArray()
        if (!filteredProperties.length) throw new Error(`No properties found in ${city.city}, ${city.countryCode}`)
        loggerService.debug(`PropertyService - getPropertiesByCity in ${city.city}, ${city.countryCode} \n found ${filteredProperties.length} properties`)
        return reduceList(filteredProperties,8);
    } catch (err) {
        loggerService.error('Cannot get properties by city', err)
        throw err
    }
    
    /*
    const filteredProperties = properties.filter(
        property => {
            return property.loc.lat >= city.minLat &&
                property.loc.lat <= city.maxLat &&
                property.loc.lng >= city.minLng &&
                property.loc.lng <= city.maxLng
        }
    )
    const randomProperties = reduceList(filteredProperties,8);
    loggerService.debug(`PropertyService - getPropertiesByCity in ${city.city}, ${city.countryCode} \n found ${filteredProperties.length} properties, returned 8 random properties`)
    return randomProperties;
    */
}

async function getPropertiesByUserId(userId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const criteria={host: ObjectId.createFromHexString(userId)}
        const userProperties = await collection.find(criteria).toArray()
        loggerService.debug(`PropertyService - getPropertiesByUserId: ${userId} found ${userProperties.length} properties`)
        return userProperties.map(property => property._id.toString())
    } catch (err) {
        loggerService.error('Cannot get properties by user id', err)
        throw err
    }
}