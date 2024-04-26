const { Router } = require('express')
const userModel = require('../dao/models/user.model')
const { hashPassword } = require('../utils/hashing')

const router = Router()

router.post('/login', async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ error: 'Credenciales inválidas!' })
    }

    //verifico si es el usuario "ADMIN"
    let user
    if (email === "adminCoder@coder.com" && password === "adminCod3r123") {
        user = {
            rol: "admin",
            firstName: "Coder",
            lastName: "House",
            email: email,
            password: password,
            age: 47,
            _id: "dflksgd8sfg7sd890fg"
        }
    }
    else {

        //lo busco en la BD
        user = await userModel.findOne({ email })
        if (!user) {
            return res.status(401).send('No se encontró el usuario!')
        }

        // validar el password
        if (!isValidPassword(password, user.password)) {
            return res.status(401).json({ error: 'Password inválida!' })
        }
    }    

    req.session.user = { id: user._id.toString(), email: user.email, age: user.age, firstName: user.firstName, lastName: user.lastName, rol: user.rol }

    return res.redirect('/products')
})

router.post('/register', async (req, res) => {
    const { firstName, lastName, email, age, password, rol } = req.body

    try {
        await userModel.create({
            firstName,
            lastName,
            age: +age,
            email,
            password: hashPassword(password),
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