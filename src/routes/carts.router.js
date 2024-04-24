const { Router } = require('express')
const CartManager = require('../dao/fsManagers/CartManager');
const ProductManager = require('../dao/fsManagers/ProductManager')

const router = Router()

//middlewares

async function validateNewCart(req, res, next) {
    const productManager = req.app.get('productManager')
    const { products } = req.body

    //valido que cada producto que quiero agregar a un carrito exista y que su quantity sea un valor positivo
    products.forEach(async producto => {
        const prod = await productManager.getProductById(producto._id)
        if (!prod) {
            res.status(400).json({ error: `No se puede crear el carrito porque no existe el producto con ID '${producto._id}'.` })
            return
        }
        //valido además que su campo quantity sea un valor positivo
        if (!productManager.esPositivo(producto.quantity)) {
            res.status(400).json({ error: `El valor de quantity del producto con ID '${producto._id}' es inválido.` })
            return
        }
    })
    //exito, continuo al endpoint
    return next()
}

async function validateCart(req, res, next) {
    const cartManager = req.app.get('cartManager')
    let cartId = req.params.cid;

    // if (isNaN(cartId)) {
    //     // HTTP 400 => hay un error en el request o alguno de sus parámetros
    //     res.status(400).json({ error: "Formato inválido del ID del carrito." })
    //     return
    // }

    const cart = await cartManager.getCartById(cartId)
    if (!cart) {
        res.status(400).json({ error: `No existe el carrito con ID '${cartId}'.` })
        return
    }
    //exito, continuo al endpoint
    return next()
}

async function validateProduct(req, res, next) {
    const productManager = req.app.get('productManager')
    let prodId = req.params.pid;

    const prod = await productManager.getProductById(prodId)
    if (!prod) {
        res.status(400).json({ error: `No existe el producto con ID '${prodId}'.` })
        return
    }
    //exito, continuo al endpoint
    return next()
}

//endpoints

router.get('/', async (req, res) => {
    try {
        const cartManager = req.app.get('cartManager')
        const carts = await cartManager.getCarts()
        // HTTP 200 OK
        res.status(200).json(carts)
        return
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

router.get('/:cid', validateCart, async (req, res) => {
    try {
        const cartManager = req.app.get('cartManager')
        let cartId = req.params.cid;

        let cartById = await cartManager.getCartById(cartId);

        if (cartById)
            // HTTP 200 OK => se encontró el carrito
            res.status(200).json(cartById)
        else {
            // HTTP 404 => el ID es válido, pero no se encontró ese carrito
            res.status(404).json(`El carrito con código '${cartId}' no existe.`)
            return
        }
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

router.post('/', validateNewCart, async (req, res) => {
    try {
        const cartManager = req.app.get('cartManager')
        const { products } = req.body;

        // console.log(products)

        await cartManager.addCart(products);

        // HTTP 201 OK => carrito creado exitosamente
        res.status(201).json(`Carrito creado exitosamente.`)
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

router.post('/:cid/products/:pid', validateCart, validateProduct, async (req, res) => {
    try {
        const cartManager = req.app.get('cartManager')
        let cartId = req.params.cid;
        let prodId = req.params.pid;
        let quantity = 1;

        await cartManager.addProductToCart(cartId, prodId, quantity);

        // HTTP 200 OK => carrito modificado exitosamente
        res.status(200).json(`Se agregaron ${quantity} producto/s con ID ${prodId} al carrito con ID ${cartId}.`)
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

router.put('/:cid', validateCart, async (req, res) => {
    try {
        const cartManager = req.app.get('cartManager')
        let cartId = req.params.cid;
        const { products }= req.body;

        await cartManager.updateCartProducts(cartId, products);

        // HTTP 200 OK => se encontró el carrito
        res.status(200).json(`Los productos del carrito con ID ${cartId} se actualizaron exitosamente.`)
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

router.put('/:cid/products/:pid', validateCart, validateProduct, async (req, res) => {
    try {
        const cartManager = req.app.get('cartManager')
        let cartId = req.params.cid;
        let prodId = req.params.pid;
        const quantity = +req.body.quantity;        
        
        const result = await cartManager.addProductToCart(cartId, prodId, quantity);

        if (result)
            // HTTP 200 OK => carrito modificado exitosamente
            res.status(200).json(`Se agregaron ${quantity} producto/s con ID ${prodId} al carrito con ID ${cartId}.`)
        else {
            //HTTP 400 Bad Request
            res.status(400).json({ error: "El servidor no pudo entender la solicitud debido a una sintaxis incorrecta." })
        }

        
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

router.delete('/:cid', validateCart, async (req, res) => {
    try {
        const cartManager = req.app.get('cartManager')
        let cartId = req.params.cid;

        await cartManager.deleteCart(cartId)

        // HTTP 200 OK
        res.status(200).json(`Carrito borrado exitosamente.`)  

        // await cartManager.deleteAllProductsFromCart(cartId)

        // // HTTP 200 OK
        // res.status(200).json(`Se eliminaron todos los productos del carrito con ID ${cartId}.`)
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

router.delete('/:cid/products/:pid', validateCart, validateProduct, async (req, res) => {
    try {
        const cartManager = req.app.get('cartManager')
        let cartId = req.params.cid;
        let prodId = req.params.pid;

        const result = await cartManager.deleteProductFromCart(cartId, prodId);

        if (result)
            // HTTP 200 OK => carrito modificado exitosamente
            res.status(200).json(`Se eliminó el producto con ID ${prodId} del carrito con ID ${cartId}.`)
        else {
            //HTTP 400 Bad Request
            res.status(400).json({ error: "El servidor no pudo entender la solicitud debido a una sintaxis incorrecta." })
        }
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

module.exports = router;