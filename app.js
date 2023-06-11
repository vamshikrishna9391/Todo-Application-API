const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { format, compareAsc } = require("date-fns");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "./todoApplication.db");
let db = null;

const installDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running At port :3000");
    });
  } catch (e) {
    console.log(e.message);
  }
};

installDBAndServer();

const checkingRequestQuery = (request, response, next) => {
  const { status, priority, category, date } = request.query;
  if (
    status !== undefined &&
    !["TO DO", "IN PROGRESS", "DONE"].includes(status)
  ) {
    response.status(400);
    response.send("Invalid Todo Status");
    return;
  }

  if (priority !== undefined && !["HIGH", "MEDIUM", "LOW"].includes(priority)) {
    response.status(400);
    response.send("Invalid Todo Priority");
    return;
  }

  if (
    category !== undefined &&
    !["WORK", "HOME", "LEARNING"].includes(category)
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
    return;
  }

  if (date !== undefined) {
    try {
      request.query.date = format(new Date(date), "yyyy-MM-dd");
      //   console.log(format(new Date(date), "yyyy-MM-dd"));
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  next();
};

const checkingRequestBody = (request, response, next) => {
  const { status, priority, category, dueDate } = request.body;
  if (
    status !== undefined &&
    !["TO DO", "IN PROGRESS", "DONE"].includes(status)
  ) {
    response.status(400);
    response.send("Invalid Todo Status");
    return;
  }

  if (priority !== undefined && !["HIGH", "MEDIUM", "LOW"].includes(priority)) {
    response.status(400);
    response.send("Invalid Todo Priority");
    return;
  }

  if (
    category !== undefined &&
    !["WORK", "HOME", "LEARNING"].includes(category)
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
    return;
  }

  if (dueDate !== undefined) {
    try {
      request.query.dueDate = format(new Date(dueDate), "yyyy-MM-dd");
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  next();
};

//API 1

app.get("/todos/", checkingRequestQuery, async (request, response) => {
  const {
    status = "",
    priority = "",
    category = "",
    search_q = "",
  } = request.query;
  const getQuery = `
        SELECT 
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate
        FROM
            todo 
        WHERE 
        priority LIKE '%${priority}%' AND 
        status LIKE '%${status}%' AND 
        category LIKE '%${category}%' AND 
        todo LIKE '%${search_q}%';
    `;

  const dbResponse = await db.all(getQuery);
  response.send(dbResponse);
});

// API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getQuery = `
    SELECT 
        id,
        todo,
        priority,
        status,
        category,
        due_date AS dueDate
    FROM
        todo 
    WHERE 
        id = ${todoId}
    `;

  const dbResponse = await db.get(getQuery);
  response.send(dbResponse);
});

// API 3

app.get("/agenda/", checkingRequestQuery, async (request, response) => {
  const { date } = request.query;

  const getTodoQuery = `
        SELECT 
        id,todo,priority,status,category,due_date AS dueDate
        FROM todo WHERE due_date LIKE "${date}";
    `;

  const dbResponse = await db.all(getTodoQuery);
  response.send(dbResponse);
});

// API 4

app.post("/todos/", checkingRequestBody, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const postTodoQuery = `
        INSERT INTO todo(id,todo,priority,status,category,due_date)
        VALUES (
            ${id},
            '${todo}',
            '${priority}',
            '${status}',
            '${category}',
            '${dueDate}'
        );
    `;
  await db.run(postTodoQuery);

  response.send("Todo Successfully Added");
});

// API 5

app.put("/todos/:todoId/", checkingRequestBody, async (request, response) => {
  const { todoId } = request.params;
  const { todo, priority, status, category, dueDate } = request.body;

  let putQuery = null;
  switch (true) {
    case todo !== undefined:
      putQuery = `
            UPDATE todo 
            SET 
              todo  = '${todo}'
            WHERE id = ${todoId}
            `;
      break;

    case priority !== undefined:
      putQuery = `
            UPDATE todo 
            SET 
              priority  = '${priority}'
            WHERE id = ${todoId}
            `;
      break;

    case status !== undefined:
      putQuery = `
            UPDATE todo 
            SET 
              status  = '${status}'            
            WHERE id = ${todoId}
            `;
      break;

    case category !== undefined:
      putQuery = `
            UPDATE todo 
            SET 
              category  = '${category}'            
            WHERE id = ${todoId}
            `;
      break;

    default:
      putQuery = `
            UPDATE todo 
            SET 
              due_date  = '${dueDate}'
            WHERE id = ${todoId}
            `;
      break;
  }
  await db.run(putQuery);

  switch (Object.keys(request.body)[0]) {
    case "status":
      response.send("Status Updated");
      break;
    case "priority":
      response.send("Priority Updated");
      break;
    case "category":
      response.send("Category Updated");
      break;
    case "dueDate":
      response.send("Due Date Updated");
      break;
    default:
      response.send("Todo Updated");
  }
});

// API 6 DELETE

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo WHERE id = ${todoId}
    `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
