const { Router } = require('express')

const router = Router()

//middlewares

async function validateNewProduct(req, res, next) {
    const productManager = req.app.get('productManager')
    const product = req.body

    product.thumbnail = [product.thumbnail]
    product.status = JSON.parse(product.status)

    product.price = +product.price
    product.stock = +product.stock

    if (productManager.validateProduct(product.title,
        product.description,
        product.price,
        product.thumbnail,
        product.code,
        product.stock,
        product.status,
        product.category)) {
        //debo verificar también que el campo "code" no se repita
        const prod = await productManager.getProductByCode(product.code)
        if (prod) {
            let msjeError = `No se permite agregar el producto con código '${product.code}' porque ya existe.`
            console.error(msjeError)
            // HTTP 400 => code repetido
            res.status(400).json({ error: msjeError })
            return
        }
        //exito, continuo al endpoint
        return next()
    }
    // HTTP 400 => producto con valores inválidos
    res.status(400).json({ error: "El producto que se quiere agregar posee algún campo inválido." })
}

async function validateUpdateProduct(req, res, next) {
    const productManager = req.app.get('productManager')

    const prodId = req.params.pid
    const product = req.body

    //primero debo verificar que el producto exista en mi array de todos los productos
    const prod = await productManager.getProductById(prodId)
    if (!prod) {
        // HTTP 404 => no existe el producto
        res.status(404).json({ error: `El producto con ID '${prodId}' no se puede modificar porque no existe.` })
        return
    }

    if (productManager.validateProduct(product.title,
        product.description,
        product.price,
        product.thumbnail,
        product.code,
        product.stock,
        product.status,
        product.category)) {
        //verifico que el campo "code", que puede venir modificado, no sea igual al campo code de otros productos ya existentes
        let allProducts = await productManager.getProducts(req.query)
        let producto = allProducts.docs.find(element => ((element.code === product.code) && (element._id != prodId)))
        if (producto) {
            let msjeError = `No se permite modificar el producto con código '${product.code}' porque ya existe.`
            console.error(msjeError)
            // HTTP 400 => code repetido
            res.status(400).json({ error: msjeError })
            return
        }

        //exito, continuo al endpoint
        return next()
    }
    // HTTP 400 => producto con valores inválidos
    res.status(400).json({ error: "El producto que se quiere modificar posee algún campo inválido." })
}


async function validateProduct(req, res, next) {
    const productManager = req.app.get('productManager')
    let prodId = req.params.pid;

    // if (isNaN(prodId)) {
    //     // HTTP 400 => hay un error en el request o alguno de sus parámetros
    //     res.status(400).json({ error: "Formato inválido del productID." })
    //     return
    // }

    //primero debo verificar que el producto exista en mi array de todos los productos
    const prod = await productManager.getProductById(prodId)
    if (!prod) {
        // HTTP 404 => no existe el producto
        res.status(404).json({ error: `El producto con ID '${prodId}' no existe.` })
        return
    }

    //exito, continuo al endpoint
    return next()
}


//endpoints

router.get('/', async (req, res) => {
    try {
        const productManager = req.app.get('productManager')

        const filteredProducts = await productManager.getProducts(req.query)

        const result = {
            payload: filteredProducts.totalDocs,
            totalPages: filteredProducts.totalPages,
            prevPage: filteredProducts.prevPage,
            nextPage: filteredProducts.nextPage,
            page: filteredProducts.page,
            hasPrevPage: filteredProducts.hasPrevPage,
            hasNextPage: filteredProducts.hasNextPage,
            prevLink: filteredProducts.hasPrevPage ? `/products?page=${filteredProducts.prevPage}` : null,
            nextlink: filteredProducts.hasNextPage ? `/products?page=${filteredProducts.nextPage}` : null
        }

        let status = 'success'
        if (filteredProducts.docs.length == 0)
            status = 'error'
        let finalResult = {
            status,
            ...result
        }

        // HTTP 200 OK
        return res.status(200).json(finalResult)
    }
    catch (err) {
        return res.status(500).json({ error: err })
    }
})

router.get('/:pid', validateProduct, async (req, res) => {
    try {
        const productManager = req.app.get('productManager')
        const prodId = req.params.pid

        const product = await productManager.getProductById(prodId)

        if (product)
            // HTTP 200 OK => se encontró el producto
            res.status(200).json(product)
        else
            // HTTP 404 => el ID es válido, pero no se encontró ese producto
            res.status(404).json(`El producto con código '${prodId}' no existe.`)
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

router.post('/create', validateNewProduct, async (req, res) => {
    try {
        const productManager = req.app.get('productManager')

        const newProduct = req.body

        // newProduct.thumbnail = [newProduct.thumbnail]
        newProduct.status = JSON.parse(newProduct.status)

        //agregar el producto al productManager
        await productManager.addProduct(newProduct.title,
            newProduct.description,
            newProduct.price,
            newProduct.thumbnail,
            newProduct.code,
            newProduct.stock,
            newProduct.status,
            newProduct.category)

        // //notificar a los demás browsers mediante WS
        // req.app.get('io').emit('newProduct', newProduct)

        // HTTP 201 OK => producto creado exitosamente
        res.status(201).json(`El producto con código '${newProduct.code}' se agregó exitosamente.`)

        // res.redirect('/allProducts')
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }

    // const product = req.body

    // await productManager.addProduct(product.title,
    //                                 product.description,
    //                                 product.price,
    //                                 product.thumbnail,
    //                                 product.code,
    //                                 product.stock,
    //                                 product.status,
    //                                 product.category)

    // // HTTP 201 OK => producto creado exitosamente
    // res.status(201).json(`El producto con código '${product.code}' se agregó exitosamente.`)
})

router.put('/:pid', validateUpdateProduct, async (req, res) => {
    try {
        const productManager = req.app.get('productManager')
        const prodId = req.params.pid
        const productUpdated = req.body

        //valido el ID que hasta el momento no fue evaluado
        // if (isNaN(prodId)) {
        //     // HTTP 400 => hay un error en el request o alguno de sus parámetros
        //     res.status(400).json({ error: "Formato inválido del productID." })
        //     return
        // }

        const productActual = await productManager.getProductById(prodId)
        if (productActual) {
            await productManager.updateProduct(productUpdated, prodId)

            // HTTP 200 OK => producto modificado exitosamente
            res.status(200).json(productUpdated)
        }
        else
            // HTTP 404 => el ID es válido, pero no se encontró ese producto
            res.status(404).json(`El producto con código '${prodId}' no existe.`)
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

router.delete('/:pid', validateProduct, async (req, res) => {
    try {
        const productManager = req.app.get('productManager')
        const prodId = req.params.pid

        const product = await productManager.getProductById(prodId)
        if (product) {
            await productManager.deleteProduct(prodId)            

            // HTTP 200 OK => producto eliminado exitosamente
            return res.status(200).json(`El producto con código '${prodId}' se eliminó exitosamente.`)
        }
        else {        
            // HTTP 404 => el ID es válido, pero no se encontró ese producto
            return res.status(404).json(`El producto con código '${prodId}' no existe.`)
        }
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

module.exports = router