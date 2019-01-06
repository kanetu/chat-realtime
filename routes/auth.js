const express = require('express');
const router = express.Router();

router.get('/', (req, res)=>{
	res.render('register');
});


router.post('/register', (req, res) => {
	let nickname = req.body.nickname;
	res.cookie('nickname', nickname);
	res.redirect('/');
});

module.exports = router;