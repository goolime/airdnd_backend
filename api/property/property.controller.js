import { loggerService } from '../../services/logger.service.js'
import { propertyService } from './property.service.js'
import { usersService } from '../user/users.service.js'
//import { ordersService } from '../order/orders.service.js'

export async function getProperties(req, res) {

    const searchParams = new URLSearchParams(req.query);
    const filterBy = _getFilterFromSearchParams(searchParams);

    try {
        const properties = await propertyService.query(filterBy)
        res.send(properties.map(property => _prepForUI(property)))
    }
    catch (err) {
        loggerService.error('Cannot get properties', err)
        res.status(400).send({ err: 'Cannot get properties' })
    }

}

export async function getProperty(req, res) {
    const { propertyId } = req.params
    try {
        const property = await propertyService.getById(propertyId)
        res.send(_prepForUI(property))
    }
    catch (err) {
        loggerService.error(`Cannot get property ${propertyId}`, err)
        res.status(400).send({ err: `Cannot get property ${propertyId}` })
    }
}
export async function removeProperty(req, res) {
    const { propertyId } = req.params
    try {
        const ownerId = await propertyService.remove(propertyId)
        usersService.removePropertyFromHost(propertyId, ownerId)
        //ordersService.removeFutureOrdersByPropertyId(propertyId)
        res.send({ msg: `Property ${propertyId} removed successfully` })
    } catch (err) {
        loggerService.error(`Cannot remove property ${propertyId}`, err)
        res.status(400).send({ err: `Cannot remove property ${propertyId}` })
    }
}
export async function addProperty(req, res) {
    const {name, type,imgUrls, price, summary, capacity, amenities, accessibility, bathrooms, bedrooms, beds, rules, labels} = req.body
    if (!name || !type || !price || !summary || !capacity || !amenities || !accessibility || !bathrooms || !bedrooms || !beds) {
        return  res.status(400).send({ err: 'Missing required fields to update property' })
    }
    
    const property= _getEmptyProperty(name, type,imgUrls, price, summary, capacity, amenities, accessibility, bathrooms, bedrooms, beds, rules, labels)
    try {
        const addedProperty = await propertyService.save(property)
        usersService.setNewPropertyToHost(addedProperty._id, addedProperty.ownerId)
        res.send(_prepForUI(addedProperty))
    }
    catch (err) {
        loggerService.error('Cannot add property', err)
        res.status(400).send({ err: 'Cannot add property' })
    }

}
export async function updateProperty(req, res) {
    const {name, type,imgUrls, price, summary, capacity, amenities, accessibility, bathrooms, bedrooms, beds, rules, labels} = req.body
    if (!name || !type || !price || !summary || !capacity || !amenities || !accessibility || !bathrooms || !bedrooms || !beds) {
        return  res.status(400).send({ err: 'Missing required fields to update property' })
    }
    
    const property= _getEmptyProperty(name, type,imgUrls, price, summary, capacity, amenities, accessibility, bathrooms, bedrooms, beds, rules, labels)
    try {
        const existingProperty = await propertyService.getById(propertyId)
        if (!existingProperty) {
            return res.status(404).send({ err: `Property with id ${propertyId} not found` })
        }
        for (const field of Object.keys(existingProperty)) {
            if (property[field] === undefined) {
                property[field] = existingProperty[field]
            }
        }
        const updatedProperty = await propertyService.save(property)
        res.send(_prepForUI(updatedProperty))
    }
    catch (err) {
        loggerService.error('Cannot update property', err)
        res.status(400).send({ err: 'Cannot update property' })
    }
}

export async function getPropertiesByCity(req, res) {
    const searchParams = new URLSearchParams(req.query);
    const city ={
        countryCode: searchParams.get('countryCode') || '',
        city: searchParams.get('city') || '',
        minLat: +searchParams.get('minLat') || -90,
        maxLat: +searchParams.get('maxLat') || 90,
        minLng: +searchParams.get('minLng') || -180,
        maxLng: +searchParams.get('maxLng') || 180,
    }
    try {
        const cityProperties = await propertyService.getPropertiesByCity(city)
        res.send(cityProperties.map(property => _prepForUI(property)))
    }
    catch (err) {
        loggerService.error('Cannot get properties by city', err)
        res.status(400).send({ err: 'Cannot get properties by city' })
    }

}

export async function postReview(req, res) {
    const { propertyId } = req.params
    const {txt, rate, by} = req.body
    const review= {
        txt: txt || '',
        rate: +rate || 0,
        by: req.loginToken._id,
    }
    try {
        const ansReview = await propertyService.postReview(propertyId, review)
        res.send(ansReview)
    } catch (err) {
        loggerService.error('Cannot post review', err)
        res.status(400).send({ err: 'Cannot post review' })
    }
}

/////////////////////  Helpers  ///////////////////////// 

function _getFilterFromSearchParams(searchParams) {
    const defaultFilter = _getDefaultFilter()
    const filterBy = {}
    for (const field in defaultFilter) {
        if (Array.isArray(defaultFilter[field])){
           //console.log('array field parse:', field, filterBy[field], JSON.parse(searchParams.get(field)))
            filterBy[field] = searchParams.get(field) ? JSON.parse(searchParams.get(field)) : defaultFilter[field]
            continue
        }
        else if (defaultFilter[field] instanceof Object) {
            for (const subField in defaultFilter[field]) {
                const key = `${field}.${subField}`
                filterBy[field] = filterBy[field] || {}
                if (field === 'dates') {
                   filterBy[field][subField] = ( searchParams.get(key) && searchParams.get(key) !== "null" ) ? new Date(searchParams.get(key)) : defaultFilter[field][subField]
                }
                else if( field === 'guests' ) {
                    filterBy[field][subField] = +searchParams.get(key) || defaultFilter[field][subField]
                }
                else if (field === 'loc') {
                    if(subField==='countryCode' || subField==='city'){
                        filterBy[field][subField] = searchParams.get(key) || defaultFilter[field][subField]
                    }
                    else {
                        filterBy[field][subField] = +searchParams.get(key) || defaultFilter[field][subField]
                    }
                }
                else {
                    
                    filterBy[field][subField] = searchParams.get(key) || defaultFilter[field][subField]
                }
            }
            continue
        }
        if (field === 'types' || field === 'txt') {
            filterBy[field] = searchParams.get(field) || defaultFilter[field]
        }
        else {
            filterBy[field] = +searchParams.get(field) || defaultFilter[field]
        }
    }
    if(filterBy.caseSensitive){
        if(filterBy.caseSensitive==='true') filterBy.caseSensitive=true
        else filterBy.caseSensitive=false
    }
    return filterBy
}

function _getDefaultFilter() {
    return { 
        type: 'any',
        types: [],
        maxPrice: 0,
        minPrice: 0,
        guests: { adults: 0, kids: 0, infants: 0, pets: 0 },
        amenities: [],
        accessibility: [],
        rules: [],
        labels: [],
        bathrooms: 0,
        bedrooms: 0,
        beds: 0,
        //host: null,
        dates: {from:null,to:null},
        loc: { countryCode: '', city: '', maxLat: 90, minLat: -90, maxLng: 180, minLng: -180},
        raiting: 0,
    }
}

/*
function _propertyFromSearchParams(searchParams){
    const emptyProperty = _getEmptyProperty()
    const newProperty = {}
    for (const field in emptyProperty) {
        if (Array.isArray(emptyProperty[field])){
           //console.log('array field parse:', field, filterBy[field], JSON.parse(searchParams.get(field)))
            newProperty[field] = searchParams.get(field) ? JSON.parse(searchParams.get(field)) : emptyProperty[field]
            continue
        }
        else if (emptyProperty[field] instanceof Object) {
            for (const subField in emptyProperty[field]) {
                const key = `${field}.${subField}`
                newProperty[field] = newProperty[field] || {}
                if (field === 'capacity' || ( field === 'loc' && (subField === 'lat' || subField === 'lng'))) {
                    newProperty[field][subField] = +searchParams.get(key) || emptyProperty[field][subField]
                }
                else {
                    newProperty[field][subField] = searchParams.get(key) || emptyProperty[field][subField]
                }
            }
            continue
        }
        else if (field === 'name' || field === 'type' || field === 'summary' ) {
            newProperty[field] = searchParams.get(field) || emptyProperty[field]
        }
        else if (field === 'price' || field === 'bathrooms' || field === 'bedrooms' || field === 'beds') {
            newProperty[field] = +searchParams.get(field) || emptyProperty[field]
        }
    }
    return newProperty
}
*/

function _getEmptyProperty( name = '', 
                           type= null,
                           imgUrls= [], 
                           price = 0, 
                           summary= '', 
                           capacity= {adults:1,kids:0,infants:0,pets:0},
                           amenities= [],
                           accessibility= [],
                           bathrooms= 1,
                           bedrooms= 1,
                           beds= 1,
                           rules= [],
                           labels= [],
                           host=  {fullname: "", imgUrl: "", _id: ""},
                           loc= {country: null, countryCode: null, city: null, address: null, lat: 0, lng: 0},
                           reviews= []) {
    return { name,
             type,
             imgUrls,
             price,
             summary,
             capacity,
             amenities,
             accessibility,
             bathrooms,
             bedrooms,
             beds,
             rules,
             labels,
             host,
             loc,
             reviews
         }
}

function _prepForUI(property) {
    const prepProperty={...property};
    prepProperty.host = usersService.getMiniUserById(property.host);
    prepProperty.reviews = property.reviews.map(review => {
        return {
            ...review,
            by: usersService.getMiniUserById(review.by)
        }
    });
    return prepProperty;
}