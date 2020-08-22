const user = require('../models/user.js');
const Database = require('./database.js');
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');

const secretKey = process.env.cryptosecret || "your-crypto-secret-key"

//class User inherits class database which adds various functionalities to it 
class User extends Database {
    
    constructor(Data) {
        super();                //calls the constructor of the super class, if we don't do this it will result in a reference error
        let data = Data;        //create a copy of the original data, so that it cannot be modified/manipulated.
        this.getData = () => {  //declare a class method to privately access the data, to show Abstraction
            return data;        /* *USE OF ABSTRACTION* */
                                //return the copied data, so that other methods can access it and the original data remains safe
        }                        
    }


    async createUser() {
        
        let bool = await this.findExisting(this.getData().username);    //calls the findExisting function of Database class to check if username already exists
                                                                        //*advantage of inheritance* 
                                                                    //the function is directly accessible to the User class because of inheritance
        if(bool===null){
        let flag = 1;
        let newUser = new user(this.getData());
        let cryptedPassword = CryptoJS.AES.encrypt(this.getData().password, secretKey)
        newUser.password = cryptedPassword;
        await newUser.save((err, user) => {
            if (err) {
                console.log("An error occured while saving your data:\n" + err);
                flag = 0;
            } else {
                console.log("A new user has been registered. The Data is as follows:\n" + newUser);
            }
        });;
        if (flag === 1) {
            return newUser;
        } 
        else {
            return null;
        }
        }
        else{
            return null;
        }
    }

    async loginCheck(username,password){
        let user = await this.findExisting(username,password);
        return user;
    }

    async generateToken(User,res){
        if (User != null) {
            let userid = User._id;
            const accessToken = jwt.sign(User.toJSON(), process.env.JWT_KEY);
            res.cookie('Authorization', accessToken, {
                maxAge: 1000000000000,
                httpOnly: false
            });
            
            let userdata = await user.findById(userid);
            await userdata.tokens.push(accessToken);
            await userdata.save();
            res.redirect('/')
        } else {
            res.send('Wrong credentials');
        }
    }

    async logout(user,req,res,all=false){
        if(all===false){
        let token = req.cookies.Authorization;
        res.clearCookie("Authorization");
        user.tokens = user.tokens.filter(ele=>{
            return ele._id != token;
        }) 
        await user.save();
    }
    else if(all === true){
        user.tokens = [];
        console.log('Cleared all tokens');
        await user.save();
        let token = req.cookies.Authorization;
        res.clearCookie("Authorization");        
    }

    else{
        res.send('Invalid Argument');
    }
    }

}

module.exports = User;