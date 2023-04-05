const request = require("supertest");
var cheerio = require("cheerio");

const db = require("../models/index");
const app = require("../app");

let server, agent;

function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

describe("Todo test suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });
  test("Create a new todo", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      "_csrf":csrfToken
    });
    expect(response.statusCode).toBe(302);
  });
   test("Mark a todo as complete", async () =>{
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
        await agent.post('/todos').send({
            'title': 'Buy milk',
            dueDate: new Date().toISOString(),
            completed:false,
            "_csrf":csrfToken
        });
        
        const groupedTodosResponse = await agent
        .get("/")
        .set("Accept", "application/json");
        const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
        const dueTodayCount = parsedGroupedResponse.DToday.length;
        const latestTodo = parsedGroupedResponse.DToday[dueTodayCount - 1];

        res = await agent.get("/");
        csrfToken = extractCsrfToken(res);

        const markCompleteResponse = await agent.put(`/todos/${latestTodo.id}/markAsCompleted`).send({
          _csrf: csrfToken,
        });
        const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
        expect(parsedUpdateResponse.completed).toBe(true);
    });
    
    /*test("Delete todo", async() => {
        const response = await agent.post('/todos').send({
            'title': 'Buy milk',
            dueDate: new Date().toISOString(),
            completed:false
        });
        const parsedResponse = JSON.parse(response.text);
        const todoID = parsedResponse.id;
        expect(parsedResponse.completed).toBe(false);

        const deleteTodoResponse = await agent.delete(`/todos/${todoID}`).send();
        const parsedUpdateResponse = JSON.parse(deleteTodoResponse.text);
        expect(parsedUpdateResponse.status).toBe(true);
    }); */
});
