const passport = require('passport')
const { Strategy } = require('passport-local')
const userModel = require('../dao/models/user.model')
const { hashPassword, isValidPassword } = require('../utils/hashing')

const initializeStrategy = () => {

    //defino un middleware 'register' y su estrategia asociada
    passport.use('register', new Strategy({
        passReqToCallback: true,
        usernameField: 'email'
    }, async (req, username, password, done) => {  //esta es el callback donde se especifica cómo se debe registrar un user

        const { firstName, lastName, email, age } = req.body

        try {
            user = await userModel.findOne({ email: username })
            if (user) {
                //ya existe un usuario con ese email
                return done(null, false)
            }

            //puedo continuar con la registración
            const newUser = {
                firstName,
                lastName,
                email,
                age: + age,
                password: hashPassword(password)
            }

            const result = await userModel.create(newUser)

            // registro exitoso
            return done(null, result)
        }
        catch (err) {
            done(err)
        }
    }))


}

module.exports = initializeStrategy