const express = require("express")

const server = express()

server.get('/usuario', (request, response) => {
    return response.send("Usuario criado com sucesso")
})

server.listen(3001)