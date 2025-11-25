import { dbService } from "../../services/db.service.js";
import { loggerService } from "../../services/logger.service.js";
import { ObjectId } from 'mongodb';

const COLLECTION_NAME = 'airbnb_reviews'

export const reviewService = {
    addReview,
    getReviewsByPropertyId
}

async function addReview(review) {
    console.log('Adding review for propertyId:', review.property, 'review:', review);
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        review.property = ObjectId.createFromHexString(review.property.toString())
        review.by = ObjectId.createFromHexString(review.by.toString())
        const insertResult = await collection.insertOne(review)
        review._id = insertResult.insertedId
        loggerService.debug(`ReviewService - add: ${review._id} added`)
        return review
    } catch (err) {
        loggerService.error('Cannot add review', err)
        throw err
    }
}

async function getReviewsByPropertyId(propertyId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const criteria={property: propertyId}
        const reviews = await collection.find(criteria).toArray()
        loggerService.debug(`ReviewService - getReviewsByPropertyId: ${propertyId} found ${reviews.length} reviews`)
        return reviews
    }
    catch (err) {
        loggerService.error('Cannot get reviews by property id', err)
        throw err
    }
}