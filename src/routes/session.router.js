const { Router } = require('express')
const userModel = require('../dao/models/user.model')
const { hashPassword, isValidPassword } = require('../utils/hashing')
const passport = require('passport')

const router = Router()

router.post('/login', passport.authenticate('login', { failureRedirect: '/api/sessions/faillogin' }), (req, res) => {
    // console.log(req.body)
    if (!req.user)
        return res.status(400).send({ status: 'error', error: 'Credenciales inválidas!' })
    req.session.user = {
        _id: req.user._id,
        age: req.user.age,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        rol: req.user.rol
    }

    // no es necesario validar el login aquí, ya lo hace passport!
    return res.redirect('/products')
})


router.get('/faillogin', (req, res) => {
    res.send({ status: 'error', message: 'Login erróneo.!' })
})


router.post('/reset_password', async (req, res) => {
    const { email, newPassword } = req.body

    try {
        if (!email || !newPassword) {
            return res.status(400).send('Credenciales inválidas!')
        }

        const user = await userModel.findOne({ email })
        if (!user) {
            return res.status(400).send('No se encontró el usuario!')
        }

        await userModel.updateOne({ email }, { $set: { password: hashPassword(newPassword) } })

        res.redirect('/login')
    }
    catch (err) {
        // console.log(err)
        res.status(500).send('Error al resetear el password del usuario!')
    }
})


// router.post('/register', async (req, res) => {
//     const { firstName, lastName, email, age, password, rol } = req.body

//     try {
//         await userModel.create({
//             firstName,
//             lastName,
//             age: +age,
//             email,
//             password: hashPassword(password),
//             rol
//         })

//         res.redirect('/login')
//     }
//     catch (err) {
//         // console.log(err)
//         res.status(500).send('Error al crear el usuario!')
//     }
// })

// agregamos el middleware de passport para el register
router.post('/register', passport.authenticate('register', { failureRedirect: '/api/sessions/failregister' }), async (req, res) => {
    // console.log('usuario: ', req.user)
    // no es necesario registrar el usuario aquí, ya lo hacemos en la estrategia!
    res.redirect('/login')
})

router.get('/failregister', (req, res) => {
    res.send({ status: 'error', message: 'Registración errónea.!' })
})

router.get('/logout', (req, res) => {
    req.session.destroy(_ => {
        res.redirect('/')
    })
})

module.exports = router