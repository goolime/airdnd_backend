import fs from 'fs'
import chalk from 'chalk';

export const loggerService = {
    debug(...args) {
        doLog('DEBUG', ...args)
    },
    info(...args) {
        doLog('INFO', ...args)
    },
    warn(...args) {
        doLog('WARN', ...args)
    },
    error(...args) {
        doLog('ERROR', ...args)
    }
}


const logsDir = './logs'
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir)
}

//define the time format
function getTime() {
    let now = new Date()
    return now.toLocaleString('he')
}

function isError(e) {
    return e && e.stack && e.message
}

function doLog(level, ...args) {
    const chalkfunction =
        level === 'DEBUG' ? chalk.gray :
        level === 'INFO' ? chalk.blue :
        level === 'WARN' ? chalk.yellow :
        level === 'ERROR' ? chalk.red :
        chalk.white;
    const strs = args.map(arg =>
        (typeof arg === 'string' || isError(arg)) ? arg : JSON.stringify(arg)
    )
    var line = strs.join(' | ')
    line = `${getTime()} - ${level} - ${line}\n`
    console.log(chalkfunction(line))
    fs.appendFile('./logs/backend.log', line, (err) => {
        if (err) console.log(chalk.red('FATAL: cannot write to log file'))
    })
}

