const mongoose = require('mongoose');
const User = mongoose.model('User')
const multer = require('multer')
const jimp = require('jimp')

exports.getUsers = async (req, res) => {
  const users = await User.find().select('_id name email createdAt updatedAt');
  console.log(users)
  res.json(users);
};

exports.getAuthUser = async (req, res, next) => {
  if(!req.isAuthUser) {
    return res.status(403).json({
      message: '먼저 로그인이나 회원 등록을 해주시기 바랍니다.'
    })
    return res.redirect('/signin')
  }
  res.json(req.user)
};

exports.getUserById = async (req, res, next, id) => {
  try {
    const user = await User.findOne({ _id: id });

  req.profile = user;

  const profileId = mongoose.Types.ObjectId(req.profile._id);

  if(req.user && profileId.equals(req.user._id)) {
    req.isAuthUser = true;

    return next();
  }
  } catch (error) {
    console.log(error.message)
    next();
  }
};

exports.getUserProfile = (req, res) => {
  // console.log(req.profile)
  
  if(!req.profile) {
    return res.status(404).json({
      message: '사용자가 존재 하지 않습니다.'
    })
  }
  const profile = req.profile;
  console.log(res.profile)
  res.json(profile)
};

exports.getUserFeed = async (req, res) => {
  const {following, _id} = req.profile;
  following.push(_id);
  const users = await User.find({_id: { $nin: following } })
            .select('_id name avatar');

  res.json(users);
};

const avatarOptions = {
  storage: multer.memoryStorage(),
  limits: {
    // 1mb 
    fileSize: 1024 * 1024 * 3
  },
  fileFilter: (req, file, next) => {
    if(file.mimetype.startsWith('image/')) {
      next(null, true);
    } else {
      next(null, false);
    }
  }
}

exports.uploadAvatar = multer(avatarOptions).single('avatar');

exports.resizeAvatar = async (req, res, next) => {
  if(!req.file) {
    return next();
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.avatar = `/static/uploads/avatars/${req.user.name}-${Date.now()}.${extension}`
  const image = await jimp.read(req.file.buffer);
  await image.resize(250, jimp.AUTO);
  await image.write(`./${req.body.avatar}`);
  next()

};

exports.updateUser = async (req, res, next) => {
  try {
    req.body.updatedAt = new Date().toISOString();

  const updatedUser = await User.findOneAndUpdate(
    { _id: req.user._id },
    { $set: req.body },
    {new: true , runValidators: true },
  )
    res.json(updatedUser);
  } catch (error) {
    console.log(error.message, 'line 97')
  }
};

exports.deleteUser = async (req, res) => {
  const {userId} = req.params;
  
  if(!req.isAuthUser) {
    
    return res.status(400).json({
      message: '권한이 있지 않습니다. '
    })
  }

  const deletedUser = await User.findOneAndDelete({_id: userId});
  res.json(deletedUser)
};

exports.addFollowing = async (req, res, next) => {
  const { followId } = req.body;

  await User.findOneAndUpdate(
    { _id: req.user._id },
    { $push: { following: followId }}
    )
    next()
};

exports.addFollower = async (req, res) => {
  const { followId } = req.body;

  const user = await User.findOneAndUpdate(
    {_id: followId},
    { $push: {followers: req.user._id } },
    {new : true }
  )
  res.json(user)
};

exports.deleteFollowing = async (req, res, next) => {
  const { followId } = req.body
  await User.findOneAndUpdate(
    {_id: req.user._id},
    { $pull: {following: followId}}
  );
  next();
};

exports.deleteFollower = async (req ,res, next) => {
  const { followId } = req.body;
  const user = await User.findOneAndUpdate(
    {_id: followId}, 
    {$pull: {followers: req.user._id } },
    {new: true}
  )
  res.json(user)
};  
