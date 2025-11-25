import configProd from './prod.js'
import configDev from './dev.js'
import { loggerService } from '../services/logger.service.js'


export var config
if (process.env.NODE_ENV === 'production') {
    loggerService.info('Using Production Config')
    config = configProd
} else {
    loggerService.info('Using Development Config')
    config = configDev
}


//* Uncomment the following line to use the production configuration (Mongo Atlas DB)
// config = configProd