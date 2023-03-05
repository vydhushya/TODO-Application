const { request } = require('express')
const express = require('express')
const app = express()

const bodyParser = require('body-parser')
app.use(bodyParser.json());

const { TODO } = require("./models")

app.get("/todos", (request, response) => {
    console.log("Todo List")
})

app.post("/todos", async (request, response) => {
    console.log("Creating a todo", request.body)

    try {
        const todo = await TODO.addTodo({ title: request.body.title, dueDate: request.body.dueDate })
        return response.json(todo)
    } catch (error) {
        console.log(error)
        return response.status(422).json(error)
    }
})

app.put("/todos/:id/markAsCompleted", async (request, response) => {
    console.log("We have to update a todo with ID: ", request.params.id)
    const todo = await TODO.findByPk(request.params.id)

    try {
        const updatedTodo = await todo.markAsCompleted()
        return response.json(updatedTodo)
    } catch (error) {
        console.log(error)
        return response.status(422).json(error)
    }
})

app.delete("/todo/:id", (request, response) => {

})

module.exports = app;