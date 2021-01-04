require('dotenv/config');
const express=require('express')
const router=require('./routes')
const {sequelize}=require('./models')
const passport = require('passport');
const cookieSession = require('cookie-session');
require('./routes/passport-setup');
const port=process.env.PORT || 5000;

const app=express();

// Initializes passport and passport sessions
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());

app.use('/',router);

// For an actual app you should configure this with an experation time, better keys, proxy and secure
app.use(cookieSession({
    name: 'hotspot',
    keys: ['key1', 'key2']
  }))


app.listen(port, async (err)=>{
    if(err){
        console.log("Some Error Occurred",err);
    }
    else{
        console.log(`Server is started successfully at port: ${port}`);        
    }
    // try {
    //     await sequelize.sync({alter:true});
    //     console.log("Database synced")
    // } catch (error) {
    //     console.log("Error in database sync",error);
    // }
    try {
        await sequelize.authenticate();
        console.log("Database connected")
    } catch (error) {
        console.log("Error in database connection",error);
    }
})