// validation 
const mongoose = require('mongoose');
const User = mongoose.model('User')
const passport = require('passport')
const { check, validationResult, validationErrors,
  isEmail, notEmpty, checkBody, isLength } = require('express-validator');

exports.validateSignup = (req, res, next) => {
  req.sanitizeBody('name');
  req.sanitizeBody('email');
  req.sanitizeBody('password');

  req.checkBody('name', '이름을 입력하세요').notEmpty();
  req.checkBody('name', '길이는 2글자 이상, 10글자 이하로 해주세요')
    .isLength({min: 2, max: 10});

  req.checkBody('email', '이메일 형식에 맞게 적어 주세요')
    .isEmail()
    .normalizeEmail();

  req.checkBody('password', '패스워드를 입력하세요').notEmpty();
  req.checkBody('password', '길이는 4글자 이상으로 해주시기 바랍니다')
    .isLength({min: 2});


    const errors = req.validationErrors();

  if(errors) {
    const firstErrors = errors.map(error => error.msg)[0];
    // const firstErrors = errors  
    console.log(firstErrors)
    return res.status(400).send(firstErrors)
  }

  next();

};

exports.signup = async (req, res) => {
  
  const {name, email, password} = req.body;
  const user = new User({name, email, password});
  await User.register(user, password, (err, user) => {
    if(err) {
      return res.status(500).send(err.message);
    }
    res.json(user);
    console.log(user)
  })
  

};

exports.signin = (req, res, next) => {
  const {email, password} = req.body;
  passport.authenticate('local', (err, user, info) => {
      if(err) {
        return res.status(500).send(err.message)
      }
      if(!user) {
        return res.status.json(info.message)
      }
      req.login(user, (err) => {
        if(err) {
          return res.status(500).json(err.message);
        }

        res.json(user)
      });
    })(req, res, next) 
};

exports.logout = (req, res) => {
  res.clearCookie('next-cookie.sid');

  req.logout();

  res.json({message: '로그아웃 되셨습니다.'})

};

exports.checkAuth = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  res.redirect('/signin')
};
