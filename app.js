const express = require("express");
const ejs = require("ejs");
const mongoose=require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const _ = require('lodash');

const app = express();

const post="First ques";

app.set('view engine', 'ejs');

app.use(session({
   secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());




app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/quoraDB",{useNewUrlParser: true});
mongoose.set("useCreateIndex", true);
// mongoose.usersDB=mongoose.createConnection("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema ({
  fname:String,
  lname:String,
  email: String,
  password: String,
  googleId: String
  // secret: String
});



const postSchema={
    title:String,
    content:String
}

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const Post=mongoose.model("Post",postSchema);
const User=mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});



passport.use(new GoogleStrategy({
    clientID: '',
    clientSecret: '',
    callbackURL: "http://localhost:3000/auth/google/home",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
  res.render("start");
})


app.get("/auth/google/home",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/home");
  });

app.get("/home",function(req,res){
  if(req.isAuthenticated()){
    Post.find({},function(err,psts){
        res.render("home",{
          
          posts:psts
        })
      })   
    }
    else{
      res.redirect("/login");
  }
})

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.post("/home",function(req,res){
    const pot=new Post({
      title:req.body.title,
      content:req.body.description
    })
    pot.save(function(err){
      if(!err){
        res.redirect("/home")
      }else
      {
        console.log("Error");
      }
    });
    //res.redirect("/")
  })
  app.get("/register", function(req, res){
    res.render("register");
  });

  // app.get("/home", function(req, res){
  //   User.find({"secret": {$ne: null}}, function(err, foundUsers){
  //     if (err){
  //       console.log(err);
  //     } else {
  //       if (foundUsers) {
  //         res.render("home", {usersWithSecrets: foundUsers});
  //       }
  //     }
  //   });
  // });

  app.get("/login", function(req, res){
    
    res.render("login");
  });

  app.post("/register", function(req, res){

    User.register({fname:req.body.fname,lname:req.body.lname,username: req.body.username}, req.body.password, function(err){
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function(){
          res.redirect("/home");
        });
      }
    });
  
  });
  
  app.post("/login", function(req, res){
  
    const user = new User({
      fname: req.body.fname,
      lname: req.body.lname,
      username: req.body.username,
      password: req.body.password,
    });
  
    req.login(user, function(err){
      if (err) {
        console.log(err);
      } else {
        User.findById(req.user.id, function(err, foundUser){
          if (err) {
            console.log(err);
          } else {
            if (foundUser) {
              passport.authenticate("local")(req, res, function(){
                res.redirect("/home");
              });
              
            }
            else{
              res.redirect("/register")
            }
          }
        });
        // passport.authenticate("local")(req, res, function(){
        //   res.redirect("/home");
        // });
      }
    });
  
  });

  app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
  });


app.listen(3000, function() {
    console.log("Server started on port 3000");
  });

  //1.Adding an image