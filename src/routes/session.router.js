const { Router } = require('express')
const User = require('../dao/models/user.model')

const router = Router()

router.post('/login', async (req, res) => {
    const { email, password } = req.body

    //verifico si es el usuario "ADMIN"
    let user

    console.log(email)
    console.log(password)

    if (email === "adminCoder@coder.com" && password === "adminCod3r123") {
        user = {
            rol: "admin",
            firstName: "Coder",
            lastName: "House",
            // email: email,
            // password: password,
            // _id: "dflksgd8sfg7sd890fg"
        }
        req.session.user = { firstName: user.firstName, lastName: user.lastName, rol: user.rol }

        return res.redirect('/products')
    }

    //lo busco en la BD
    user = await User.findOne({ email, password })
    if (!user) {
        return res.status(400).send('Email o password inválidos!')
    }

    req.session.user = { id: user._id.toString(), email: user.email, age: user.age, firstName: user.firstName, lastName: user.lastName, rol: user.rol }
    return res.redirect('/products')
})

router.post('/register', async (req, res) => {
    const { firstName, lastName, email, age, password, rol } = req.body

    try {
        await User.create({
            firstName,
            lastName,
            age: +age,
            email,
            password,
            rol
        })

        res.redirect('/login')
    }
    catch (err) {
        // console.log(err)
        res.status(400).send('Error al crear el usuario!')
    }
})

router.get('/logout', (req, res) => {
    req.session.destroy(_ => {
        res.redirect('/')
    })
})

module.exports = router