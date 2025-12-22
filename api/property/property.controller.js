import { loggerService } from '../../services/logger.service.js'
import { propertyService } from './property.service.js'
import { usersService } from '../user/users.service.js'
import { reviewService } from '../reviews/review.service.js';
import { ordersService } from '../order/orders.services.js'

export async function getProperties(req, res) {

    const searchParams = new URLSearchParams(req.query);
    const filterBy = _getFilterFromSearchParams(searchParams);

    try {
        const properties = await propertyService.query(filterBy)
        res.send(await Promise.all(properties.map(async property => await _prepForUI(property))))
    }
    catch (err) {
        loggerService.error('Cannot get properties', err)
        res.status(400).send({ err: 'Cannot get properties' })
    }

}

export async function getProperty(req, res) {
    const { propertyId } = req.params
    try {
        const property = await propertyService.getById(propertyId.toString())
        res.send(await _prepForUI(property))
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
        //usersService.removePropertyFromHost(propertyId, ownerId)
        await ordersService.removeFutureOrdersByPropertyId(propertyId)
        await reviewService.removeReviewsByPropertyId(propertyId)
        res.send({ msg: `Property ${propertyId} removed successfully` })
    } catch (err) {
        loggerService.error(`Cannot remove property ${propertyId}`, err)
        res.status(400).send({ err: `Cannot remove property ${propertyId}` })
    }
}
export async function addProperty(req, res) {
    const {name, type,imgUrls, price, summary, capacity, amenities, accessibility, bathrooms, bedrooms, beds, rules, labels, loc } = req.body
    if (!name || !type || !price || !summary || !capacity || !amenities || !accessibility || !bathrooms || !bedrooms || !beds) {
        return  res.status(400).send({ err: 'Missing required fields to update property' })
    }
    
    const property= _getEmptyProperty(name, type,imgUrls, price, summary, capacity, amenities, accessibility, bathrooms, bedrooms, beds, rules, labels, req.loginToken._id, loc)
    try {
        console.log('property in controller:', property)
        const addedProperty = await propertyService.save(property)
        //await usersService.setNewPropertyToHost(addedProperty._id, addedProperty.ownerId)
        res.send(await _prepForUI(addedProperty))
    }
    catch (err) {
        loggerService.error('Cannot add property', err)
        res.status(400).send({ err: 'Cannot add property' })
    }

}
export async function updateProperty(req, res) {
    const { propertyId } = req.params
    const {name, type,imgUrls, price, summary, capacity, amenities, accessibility, bathrooms, bedrooms, beds, rules, labels} = req.body
    if (!name || !type || !price || !summary || !capacity || !amenities || !accessibility || !bathrooms || !bedrooms || !beds) {
        return  res.status(400).send({ err: 'Missing required fields to update property' })
    }
    
    const changeValues= {_id:propertyId, name, type, imgUrls, price, summary, capacity, amenities, accessibility, bathrooms, bedrooms, beds, rules, labels}
    try {
        const existingProperty = await propertyService.getById(propertyId)
        if (!existingProperty) {
            return res.status(404).send({ err: `Property with id ${propertyId} not found` })
        }
        if (existingProperty.host.toString() !== req.loginToken._id) {
            return res.status(403).send({ err: 'You are not authorized to update this property' })
        }
        /*
        for (const field of Object.keys(existingProperty)) {
            if (property[field] === undefined) {
                property[field] = existingProperty[field]
            }
        }
        */
        const updatedProperty = await propertyService.save(changeValues)
        res.send(await _prepForUI(updatedProperty))
    }
    catch (err) {
        loggerService.error('Cannot update property', err)
        console.log(err.stack)
        res.status(400).send({ err: 'Cannot update property' })
    }
}

const citysCache = new Map();
const citys=[{ countryCode: 'US', city: 'New York', minLat: 40.4774, maxLat: 40.9176, minLng: -74.2591, maxLng: -73.7004 },
             { countryCode: 'FR', city: 'Paris', minLat: 48.8156, maxLat: 48.9022, minLng: 2.2241, maxLng: 2.4699 },
             { countryCode: 'JP', city: 'Tokyo', minLat: 35.5285, maxLat: 35.8395, minLng: 139.6100, maxLng: 139.9100 },
             { countryCode: 'AU', city: 'Sydney', minLat: -34.1183, maxLat: -33.5781, minLng: 150.5209, maxLng: 151.3430 },
             { countryCode: 'BR', city: 'Rio de Janeiro', minLat: -23.0827, maxLat: -22.7468, minLng: -43.7955, maxLng: -43.0900 },
             { countryCode: 'ZA', city: 'Cape Town', minLat: -34.2580, maxLat: -33.7900, minLng: 18.3554, maxLng: 18.7034 },
             { countryCode: 'IT', city: 'Rome', minLat: 41.7690, maxLat: 42.0092, minLng: 12.3959, maxLng: 12.8555 },
             { countryCode: 'CA', city: 'Toronto', minLat: 43.5810, maxLat: 43.8555, minLng: -79.6393, maxLng: -79.1152 },
             { countryCode: 'IN', city: 'Mumbai', minLat: 18.8920, maxLat: 19.2710, minLng: 72.7754, maxLng: 72.9860 },
             { countryCode: 'GB', city: 'London', minLat: 51.2868, maxLat: 51.6919, minLng: -0.5103, maxLng: 0.3340 },
             { countryCode: 'DE', city: 'Berlin', minLat: 52.3383, maxLat: 52.6755, minLng: 13.0884, maxLng: 13.7611 },
             { countryCode: 'ES', city: 'Barcelona', minLat: 41.3200, maxLat: 41.4690, minLng: 2.0520, maxLng: 2.2280 },
             { countryCode: 'NL', city: 'Amsterdam', minLat: 52.3396, maxLat: 52.5000, minLng: 4.8342, maxLng: 5.1000 },
             { countryCode: 'MX', city: 'Mexico City', minLat: 19.2041, maxLat: 19.5926, minLng: -99.3633, maxLng: -99.0421 },
             { countryCode: 'RU', city: 'Moscow', minLat: 55.4500, maxLat: 55.9500, minLng: 37.3000, maxLng: 37.8000 },
             { countryCode: 'KR', city: 'Seoul', minLat: 37.4133, maxLat: 37.7151, minLng: 126.7341, maxLng: 127.1022 },
             { countryCode: 'ISR', city: 'Tel Aviv', minLat: 32.0150, maxLat: 32.1500, minLng: 34.7500, maxLng: 34.9000 },
             { countryCode: 'TR', city: 'Istanbul', minLat: 40.8500, maxLat: 41.2000, minLng: 28.7000, maxLng: 29.3000 },
             { countryCode: 'SE', city: 'Stockholm', minLat: 59.2000, maxLat: 59.4500, minLng: 17.8000, maxLng: 18.2000 },
             { countryCode: 'CH', city: 'Zurich', minLat: 47.3200, maxLat: 47.4500, minLng: 8.4500, maxLng: 8.6500 }
            ]

setInterval(() => {
    for (const city of citys) {
        propertyService.getPropertiesByCity(city)
            .then(properties => {
                Promise.all(properties.map(async property => await _prepForUI(property)))
                    .then(preppedProperties => {
                        citysCache.set(`${city.countryCode}-${city.city}`, preppedProperties);
                        loggerService.info(`Updated cache for city: ${city.city}, ${city.countryCode} with ${preppedProperties.length} properties`)
                    })
            })
    }
}, 1000 * 60 * 10); // Update cache every 10 minutes

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

    loggerService.info(`Getting properties in city: ${city.city}, ${city.countryCode}, within latitudes ${city.minLat} to ${city.maxLat} and longitudes ${city.minLng} to ${city.maxLng}`)

    if (Object.keys(citysCache).find(key => key === `${city.countryCode}-${city.city}`)) {
        const cachedProperties = citysCache[`${city.countryCode}-${city.city}`];
        loggerService.info(`Serving from cache: Found ${cachedProperties.length} properties in city: ${city.city}, ${city.countryCode}`)
        return res.send(cachedProperties);
    }

    try {
        if (!citys.find((c => c.countryCode === city.countryCode && c.city === city.city))) citys.push(city);
        const cityProperties = await propertyService.getPropertiesByCity(city)
        loggerService.info(`Found ${cityProperties.length} properties in city: ${city.city}, ${city.countryCode}`)
        citysCache[`${city.countryCode}-${city.city}`] = await Promise.all(cityProperties.map(async property => await _prepForUI(property)));
        res.send(citysCache[`${city.countryCode}-${city.city}`]);
    }
    catch (err) {
        loggerService.error('Cannot get properties by city', err)
        res.status(400).send({ err: 'Cannot get properties by city' })
    }

}



/////////////////////  Helpers  ///////////////////////// 

function _getFilterFromSearchParams(searchParams) {
    const defaultFilter = _getDefaultFilter()
    const filterBy = {}
    for (const field in defaultFilter) {
        if (Array.isArray(defaultFilter[field])){
            const paramValue = searchParams.get(field) ? JSON.parse(searchParams.get(field)) : defaultFilter[field]
            if (!paramValue.length) continue
            filterBy[field] = paramValue
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
        if (searchParams.get(field) === null) {
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
        guests: { adults: 0, children: 0, infants: 0, pets: 0 },
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
                           host= null,
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

async function _prepForUI(property) {
    const prepProperty={...property};
    prepProperty.host = await usersService.getMiniUserById(property.host);
    const propertyReviews = await reviewService.getReviewsByPropertyId(property._id);
    prepProperty.reviews = await Promise.all(propertyReviews.map( async review => {
        const { _id, txt, rate, by } = review;
        return {
            _id,
            txt,
            rate,
            by: await usersService.getMiniUserById(by.toString())
        }
    }));
    return prepProperty;
}