const express = require("express");
var csrf = require("tiny-csrf");
const app = express();

const flash = require("connect-flash");
const path = require("path");
app.set("views", path.join(__dirname, "views"));
app.use(flash());

const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
app.use(bodyParser.json());
app.use(express.urlencoded({ encoded: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.use(express.static(path.join(__dirname, "public")));

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");

const saltRounds = 10;

app.use(
  session({
    secret: "my-super-secret-key-217281878736472945",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(function(request, response, next) {
  response.locals.messages = request.flash();
  next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if(result ) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid Password"});
          }
          
        })
        .catch((error) => {
          return done(error);
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing userin session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

const { TODO, User } = require("./models");

var date = new Date();
var rdate = date.toLocaleDateString("en-CA");

app.set("view engine", "ejs");
app.get("/", async (request, response) => {
  response.render("index", {
    title: "Todo application",
    csrfToken: request.csrfToken(),
  });
});

app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInUser = request.user.id;
    const completed = await TODO.completed(loggedInUser);
    TODO.findAll().then((todos) => {
      var overDue = [];
      var dueToday = [];
      var dueLater = [];
     
      
      todos.map(async (todo) => {
        if (
          todo.dataValues.dueDate < rdate &&
          todo.dataValues.completed == false &&
          todo.dataValues.userId == loggedInUser
        ) {
          await overDue.push(todo.dataValues);
        } else if (
          todo.dataValues.dueDate === rdate &&
          todo.dataValues.completed === false &&
          todo.dataValues.userId == loggedInUser
        ) {
          await dueToday.push(todo.dataValues);
        } else if (
          todo.dataValues.dueDate > rdate &&
          todo.dataValues.completed == false &&
          todo.dataValues.userId == loggedInUser
        ) {
          await dueLater.push(todo.dataValues);
        }
      });
      if (request.accepts("html")) {
        response.render("todos", {
          l: { todos },
          OverD: overDue,
          DLater: dueLater,
          DToday: dueToday,
          completed: completed,
          csrfToken: request.csrfToken(),
        });
      } else {
        response.json({
          l: { todos },
          OverD: overDue,
          DLater: dueLater,
          DToday: dueToday,
          
          completed: completed,
          csrfToken: request.csrfToken(),
        });
      }
    });
  }
);

app.get("/signup", (request, response) => {
  response.render("signup", {
    csrfToken: request.csrfToken(),
  });
});

app.get("/login", (request, response) => {
  response.render("login", {
    csrfToken: request.csrfToken(),
  });
});

app.post(
  "/session",
  passport.authenticate("local", {failureRedirect: "/login",failureFlash: true,}),(request, response) => {
    console.log(request.user);
    response.redirect("/todos");
});

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.post("/users", async (request, response) => {
  if(request.body.firstName.length==0){
    request.flash("Please enter First Name");
    return response.redirect("/signup")
  }
  if(request.body.email.length===0){
    request.flash("Please enter an email");
    return response.redirect("/signup")
  }
  if(request.body.password.length===0){
    request.flash("Please enter a password");
    return response.redirect("/signup")
  }
  //hash password using bcrypt
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  console.log(hashedPwd);
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect("/todos");
    });
  } catch (error) {
    console.log(error);
  }
});

app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("Todo List");
    try {
      const alltodo = await TODO.findAll();
      return response.json(alltodo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.post(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("Creating a todo", request.body);
    console.log(request.user);
    if(request.body.title.length == 0){
      request.flash("Enter a valid title Title");
      return response.redirect("/todos")
    }
    if(request.body.dueTime.length == 0){
      request.flash("Enter a valid DueTime");
      return response.redirect("/todos")
    }
    if(request.body.dueDate.length == 0){
      request.flash("Enter a valid DueDate");
      return response.redirect("/todos")
    }
    try {
      await TODO.addTodo({
        title: request.body.title,
        dueDate: request.body.dueDate,
        userId: request.user.id,
        dueTime: request.body.dueTime,
      });
      return response.redirect("/todos");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.put(
  "/todos/:id/",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("We have to update a todo with ID: ", request.params.id);
    const todo = await TODO.findByPk(request.params.id);

    try {
      const updatedTodo = await todo.setCompletionStatus(
        request.body.completed
      );
      return response.json(updatedTodo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("Deleting a todo with ID: ", request.params.id);

    try {
      await TODO.deleteTodo(request.params.id);
      return response.json({ success: true });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

module.exports = app;
