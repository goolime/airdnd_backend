import { loggerService } from '../services/logger.service.js'


export function log(req, res, next) {
	loggerService.info(`Incoming request: ${req.method} ${req.url}`)
    next()
}
