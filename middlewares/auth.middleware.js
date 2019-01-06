module.exports.requireAuth = function(req, res, next){
	if(!req.cookies.nickname){
		res.render('register');
	}else{
		next();
	}
}