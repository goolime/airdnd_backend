import { authService } from '../api/auth/auth.service.js'

export function requireAuth(req, res, next) {
	try{
		if (!req.cookies) throw new Error('No cookies found')
		const loginToken = req.cookies.loginToken
		const loggedinUser = authService.validateToken(loginToken)

		if (!loggedinUser) return res.status(401).send('Please login')
		req.loggedInUser = loggedinUser
		next()
	} catch (err) {
    	res.status(401).send('Please login')
	}
}
