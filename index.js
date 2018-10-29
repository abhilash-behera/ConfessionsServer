var express = require('express');
var app = express();
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var bodyParser = require('body-parser');
var colors = require('colors');

var mongoDbUri = "mongodb://localhost/confessions";

var multer = require('multer');
var fs = require('fs');

var upload = multer({
  dest: __dirname+'/uploads/'
});

var PostTypes = {
  Confessions: 'confession',
  Technology: 'technology',
  Politics: 'politics',
  SexAndRelationships: 'sex and relationships',
  HealthAndFitness: 'health and fitness'
};

mongoose.connect(mongoDbUri, { useNewUrlParser: true }, function (err) {
  if (err) {
    console.log('Error in connecting to database: '.red, err);
  } else {
    console.log('Successfully connected to database:'.green, mongoDbUri);
  }
});

var UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  dob: { type: String, required: true },
  country: { type: String, required: true },
  gender: { type: String, required: true },
  secretQuestion: { type: String, required: true },
  secretAnswer: { type: String, required: true },
  email: { type: String },
  socketId: { type: String },
  status: { type: String }
});

var User = mongoose.model("user", UserSchema);

var PostSchema = new mongoose.Schema({
  image: { type: String, required: true },
  title: { type: String, required: true },
  time: { type: String, required: true },
  author: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true }
});

var Post = mongoose.model("post", PostSchema);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(function (req, res, next) {
  var request = {
    ip: req.connection.remoteAddress + ':' + req.connection.remotePort,
    userAgent: req.get('User-Agent')
  };
  console.log("request from :", request);
  next();
});

app.use(express.static(__dirname+'/uploads'));

app.get('/', function (req, res) {
  res.send('<h1>Confessions server working as expected...</h1>');
});

app.post('/login', function (req, res) {
  if (req.body.username && req.body.password) {
    User.findOne({ username: req.body.username, password: req.body.password }, { password: 0, secretQuestion: 0, secretAnswer: 0 }, function (err, user) {
      if (err) {
        console.log('Error while ' + req.body.username + ' trying to login'.red, err);
        res.json({ success: false, data: 'Something went wrong. Please try again.' });
      } else {
        if (user) {
          console.log('User logged in successfully: ' + req.body.username + ''.green);
          res.json({ success: true, data: user });
        } else {
          console.log('User not found :' + req.body.username + '@' + req.body.password + ''.red);
          res.json({ success: false, data: 'Invalid credentials. Please try again.' });
        }
      }
    });
  } else {
    console.log('Bad request for :' + req.body.username + '@' + req.body.password + ''.red);
    res.json({ success: false, data: 'Bad Request' });
  }
});

app.post('/signUp', function (req, res) {
  User.findOne({ username: req.body.username }, function (err, user) {
    if (err) {
      console.log('Error in checking username:'.red, err);
      res.json({ success: false, data: 'Something went wrong. Please try again.' });
    } else {
      if (user) {
        console.log('Username ' + req.body.username + ' already exists'.red);
        res.json({ success: false, data: 'Username already exists. Choose another.' });
      } else {
        var newUser = new User({
          username: req.body.username,
          password: req.body.password,
          dob: req.body.dob,
          country: req.body.country,
          gender: req.body.gender,
          email: req.body.email,
          secretQuestion: req.body.secretQuestion,
          secretAnswer: req.body.secretAnswer
        });

        newUser.save(function (err) {
          if (err) {
            console.log('Error in creating new user: '.red, err);
            res.json({ success: false, data: 'Something went wrong. Please try again.' });
          } else {
            console.log('New user created successfully ' + req.body.username + '.'.green);
            res.json({ success: true, data: 'Account created successfully' });
          }
        });
      }
    }
  });
});

app.post('/checkUsername', function (req, res) {
  User.findOne({ username: req.body.username }, function (err, user) {
    if (err) {
      console.log('Error in checking username: '.red, err);
      res.json({ success: false, data: 'Something went wrong. Please try again.' });
    } else {
      if (user) {
        console.log('Username ' + req.body.username + ' already taken'.red);
        res.json({ success: false, data: 'Username already taken' });
      } else {
        console.log('Username ' + req.body.username + ' available'.green);
        res.json({ success: true, data: req.body.username + ' is available' });
      }
    }
  });
});

app.post('/createPost', upload.single('image'), function (req, res) {
  var tmpPath = req.file.path;
  var ext=req.file.originalname.substr(req.file.originalname.lastIndexOf("."));
  var targetPath = req.file.destination + req.file.filename + ext;
  fs.rename(tmpPath, targetPath, function (err) {
    if (err) {
      console.log('Error in uploading file: ', err);
      res.json({ success: false, data: 'Something went wrong. Please try again.' });
    } else {
      console.log('File uploaded successfully');
      var post = new Post({
        image: '/uploads/'+req.file.filename+ext,
        title: req.body.title,
        description: req.body.description,
        author: req.body.author,
        time: req.body.time,
        type: req.body.type
      });

      post.save(function (err, p) {
        if (err) {
          console.log('Error in creating post: ', err);
          res.json({ success: false, data: 'Something went wrong. Please try again.' });
        } else {
          console.log('Post created successfully with id: ', p._id);
          res.json({ success: true, data: 'Post created successfully.' });
        }
      });
    }
  });
});

app.get('/posts/:postType', function (req, res) {
  switch (req.params.postType) {
    case PostTypes.Confessions:
      console.log('Fetching confession posts...');
      Post.find({ type: PostTypes.Confessions }, function (err, posts) {
        if (err) {
          console.log('Error in finding post of type ', req.params.postType, ':', err);
          res.json({ success: false, data: 'Something went wrong. Please try again.' });
        } else {
          console.log('Found posts of type: ', req.params.postType);
          res.json({ success: true, data: posts });
        }
      });
      break;

    case PostTypes.Technology:
      console.log('Fetching technology posts...');
      Post.find({ type: PostTypes.Technology }, function (err, posts) {
        if (err) {
          console.log('Error in finding post of type ', req.params.postType, ':', err);
          res.json({ success: false, data: 'Something went wrong. Please try again.' });
        } else {
          console.log('Found posts of type: ', req.params.postType);
          res.json({ success: true, data: posts });
        }
      });
      break;

    case PostTypes.Politics:
      console.log('Fetching politics posts...');
      Post.find({ type: PostTypes.Politics }, function (err, posts) {
        if (err) {
          console.log('Error in finding post of type ', req.params.postType, ':', err);
          res.json({ success: false, data: 'Something went wrong. Please try again.' });
        } else {
          console.log('Found posts of type: ', req.params.postType);
          res.json({ success: true, data: posts });
        }
      });
      break;

    case PostTypes.SexAndRelationships:
      console.log('Fetching Sex and Relationships posts...');
      Post.find({ type: PostTypes.SexAndRelationships }, function (err, posts) {
        if (err) {
          console.log('Error in finding post of type ', req.params.postType, ':', err);
          res.json({ success: false, data: 'Something went wrong. Please try again.' });
        } else {
          console.log('Found posts of type: ', req.params.postType);
          res.json({ success: true, data: posts });
        }
      });
      break;

    case PostTypes.HealthAndFitness:
      console.log('Fetching Health and fitness posts...');
      Post.find({ type: PostTypes.HealthAndFitness }, function (err, posts) {
        if (err) {
          console.log('Error in finding post of type ', req.params.postType, ':', err);
          res.json({ success: false, data: 'Something went wrong. Please try again.' });
        } else {
          console.log('Found posts of type: ', req.params.postType);
          res.json({ success: true, data: posts });
        }
      });
      break;

    default:
      console.log('Post type not available: ', req.params.postType);
      res.json({ success: false, data: 'Requested post type not found' });
      break;
  }
});

app.get('/post/:postId',function(req,res){
  Post.findOne({_id:mongoose.Types.ObjectId(req.params.postId)},function(err,post){
    if(err){
      console.log('Error in finding post: ',err);
      res.json({success:false,data:'Something went wrong. Please try again.'});
    }else{
      if(post){
        res.json({success:true,data:post});
      }else{
        console.log('Post not found with id: ',req.params.postId);
        res.json({success:false,data:'Post not found. Please try again.'});
      }
    }
  });
});

app.get('/uploads/:imageLocation',function(req,res){
  console.log('Requesting image: ',req.params.imageLocation);
  res.sendFile(__dirname+'/uploads/'+req.params.imageLocation);
});

app.listen(80, function (err) {
  if (err) {
    console.info('Error in starting server:'.red, err);
  } else {
    console.info('Server started successfully on port 80...'.blue);
  }
});
