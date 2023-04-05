const express = require("express");
var csrf = require("tiny-csrf");
const app = express();




const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
app.use(bodyParser.json());
app.use(express.urlencoded({ encoded: false }));
app.use(cookieParser("shh! some secret string"));

app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

const { TODO } = require("./models");

var date = new Date();
var rdate = date.toLocaleDateString("en-CA");

app.set("view engine", "ejs");
app.get("/", async (request, response) => {
  var completed = await TODO.completed();
  TODO.findAll().then((todos) => {
    var overDue = [];
    var dueToday = [];
    var dueLater = [];
    todos.map(async (todo) => {
      if (todo.dataValues.dueDate < rdate) {
        await overDue.push(todo.dataValues);
        
      } else if (todo.dataValues.dueDate == rdate) {
        await dueToday.push(todo.dataValues);
        await dueToday.pop(completed);
      } else {
        await dueLater.push(todo.dataValues);
      }
      completed.push(TODO.completed);
    });


    if(request.accepts("html")) {
      response.render("index", {
        l: { todos },
        OverD: overDue,
        DLater: dueLater,
        DToday: dueToday,
        completed : completed,
        csrfToken : request.csrfToken(),
      });
    }
    else{
      response.json({
        l: { todos },
        OverD: overDue,
        DLater: dueLater,
        DToday: dueToday,
        completed: completed,
        csrfToken : request.csrfToken(),
      })
    }
    

    
  });
});

app.get("/todos", async (request, response) => {
  console.log("Todo List");
  try {
    const alltodo = await TODO.findAll();
    return response.json(alltodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async (request, response) => {
  console.log("Creating a todo", request.body);

  try {
    await TODO.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
    });
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id/", async (request, response) => {
  console.log("We have to update a todo with ID: ", request.params.id);
  const todo = await TODO.findByPk(request.params.id);

  try {
    const updatedTodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});



app.delete("/todos/:id", async (request, response) => {
  console.log("Deleting a todo with ID: ", request.params.id);
  
  try {
    await TODO.deleteTodo(request.params.id);
    return response.json({ success: true });
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

module.exports = app;
