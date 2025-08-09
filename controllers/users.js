const User=require("../models/user.js");

module.exports.signup=(req,res)=>{
    res.render("./user/signup.ejs");
};

module.exports.logout=(req,res,next)=>{
  req.logout((err)=>{
    if(err){
       return next(err);
    }
    req.flash("success","You are logged out!");
    res.redirect("/listings");
  })
};

module.exports.pageSignup=async (req, res) => {
    try {
        let { username, email, password } = req.body;
        let newUser = new User({ email, username });
        let registeredUser=await User.register(newUser, password);
        req.login(registeredUser,(err)=>{
           if(err)return next(err);
           req.flash("success", "Registered successfully");
           res.redirect("/listings");
        })
    
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

module.exports.renderLogin=(req,res)=>{
    res.render("./user/login.ejs");
};

module.exports.login=(req,res)=>{
      req.flash("success","welcome to wanderlust you are logged in");
      let redirecturl=res.locals.redirectUrl||"/listings";
      res.redirect(redirecturl);//one thing to note is that when user logged in then req.login reset the session so the iformation is lost

};