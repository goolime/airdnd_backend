import { authService } from '../api/auth/auth.service.js'

export function requireAuth(req, res, next) {
	console.log('Cookies:', req.cookies)

	const loginToken = req.cookies.loginToken
	console.log('requireAuth loginToken:', loginToken);
	const loggedinUser = authService.validateToken(loginToken)

	if (!loggedinUser) return res.status(401).send('Please login')
    req.loginToken = loggedinUser

    next()
}
