import { dbService } from "./db.service.js"

async function initializePropertyIndexes() {
    try {
        console.log('Creating database indexes...')
        
        const collection = await dbService.getCollection('airdnd_properties')
        
        await collection.createIndex(
            { 'loc.lat': 1, 'loc.lng': 1 },
            { name: 'location_index', background: true }
        )
        
        await collection.createIndex(
            { price: 1 },
            { name: 'price_index', background: true }
        )
        
        await collection.createIndex(
            { type: 1 },
            { name: 'type_index', background: true }
        )
        
        await collection.createIndex(
            { type: 1, price: 1 },
            { name: 'type_price_index', background: true }
        )
        
        await collection.createIndex(
            { bedrooms: 1, bathrooms: 1, beds: 1 },
            { name: 'room_counts_index', background: true }
        )
        
        await collection.createIndex(
            { host: 1 },
            { name: 'host_index', background: true }
        )
        
        console.log('All property indexes created successfully!')
        
    } catch (err) {
        console.error('Failed to create indexes:', err)
    }
}

export { initializePropertyIndexes }