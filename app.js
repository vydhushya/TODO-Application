const { request } = require('express')
const express = require('express')
const app = express()

const bodyParser = require('body-parser')
app.use(bodyParser.json());

const path = require('path');
app.use(express.static(path.join(__dirname, "public")));

const { TODO } = require("./models")

var date = new Date();
var rdate = date.toLocaleDateString("en-CA");

app.set("view engine", "ejs");
app.get("/",async(request,response) => {
    TODO.findAll().then((todos) => {
        var overDue = [];
        var dueToday = [];
        var dueLater = [];
        todos.map(async (todo) => {
          if (todo.dataValues.dueDate < rdate) {
            await overDue.push(todo.dataValues);
          } else if (todo.dataValues.dueDate > rdate) {
            await dueToday.push(todo.dataValues);
          } else {
            await dueLater.push(todo.dataValues);
          }
        });
        response.render("index", {
          l: { todos },
          OverD: overDue,
          DLater: dueLater,
          DToday: dueToday,
        });
      });
});

app.get("/todos",async (request, response) => {
    console.log("Todo List")
    try{
        const alltodo = await TODO.findAll();
        return response.json(alltodo);
    }catch(error){
        console.log(error)
        return response.status(422).json(error)
    }

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

app.delete("/todos/:id", async(request, response) => {
    console.log("Deleting a todo with ID: ", request.params.id)
    const todo = await TODO.findByPk(request.params.id)
    try{
        await todo.deleteTodo()
        return response.json({status:true})
    } catch(error){
        console.log(error)
        return response.status(422).json(error)
    }
})

module.exports = app;