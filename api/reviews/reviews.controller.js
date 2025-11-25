import { reviewService } from './review.service.js'
import { loggerService } from '../../services/logger.service.js';

export async function postReview(req, res) {
    const { propertyId } = req.params
    const {txt, rate, by} = req.body
    const review= {
        txt: txt || '',
        rate: +rate || 0,
        by: req.loginToken._id,
        property: propertyId,
    }
    try {
        const ansReview = await reviewService.addReview(review)
        res.send(ansReview)
    } catch (err) {
        loggerService.error('Cannot post review', err)
        console.log(err.stack);
        res.status(400).send({ err: 'Cannot post review' })
    }
}