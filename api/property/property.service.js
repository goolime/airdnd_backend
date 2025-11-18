import { loggerService } from '../../services/logger.service.js'
import { makeId, readJsonFile, writeJsonFile, reduceList } from '../../services/utils.js'
import { ordersService } from '../order/orders.services.js'

const DATA_PATH = './data/property.json'

const properties = readJsonFile(DATA_PATH)

export const propertyService = {
    query,
    getById,
    remove,
    save,
    getPropertiesByCity,
    postReview
}

function query(filterBy,orderBy = { field: 'name', direction: 1 }) { 
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
}


function getById(propertyId) {
    try {
        const property = properties.find(property => property._id === propertyId)
        if (!property) throw new Error(`Property with id ${propertyId} not found`)
        loggerService.debug(`PropertyService - getById: ${propertyId} found`)
        return property
    } catch (err) {
        loggerService.error(`PropertyService - getById(${propertyId}) failed`, err)
        throw err
    }
}

function remove(propertyId) {
    const idx = properties.findIndex(property => property._id === propertyId)
    if (idx === -1)  throw new Error(`Property with id ${propertyId} not found`)
    const ownerId = properties[idx].ownerId
    properties.splice(idx, 1)
    writeJsonFile(DATA_PATH, properties)
    loggerService.debug(`PropertyService - remove: ${propertyId} removed`)
    return ownerId;
}

function save(property) {
    if (property._id) {
        const idx = properties.findIndex(p => p._id === property._id)
        if (idx === -1) throw new Error(`Property with id ${property._id} not found`)
        properties[idx] = property
        loggerService.debug(`PropertyService - update: ${property._id} updated`)
    } else {
        property._id = makeId()
        properties.push(property)
        loggerService.debug(`PropertyService - add: ${property._id} added`)
    }
    writeJsonFile(DATA_PATH, properties)
    return property;
}

function getPropertiesByCity(city) {
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
}

function postReview(propertyId, review) {
    const idx = properties.findIndex(property => property._id === propertyId)
    if (idx === -1) throw new Error(`Property with id ${propertyId} not found`)
    if (!properties[idx].reviews) properties[idx].reviews = []
    const postedReview = {...review, _id: makeId()}
    properties[idx].reviews.push(postedReview)
    writeJsonFile(DATA_PATH, properties)
    loggerService.debug(`PropertyService - postReview: added review to property ${propertyId}`)
    return postedReview;
}