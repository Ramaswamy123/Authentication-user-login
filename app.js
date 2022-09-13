const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//create new user in user table

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  console.log(password);
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `
               SELECT
                  *
               FROM
                  user
               WHERE username = '${username}';`;
  const UserQueryResult = await db.get(selectUserQuery);
  //   console.log(UserQueryResult);
  if (UserQueryResult === undefined && password.length >= 5) {
    const createUserQuery = `
               INSERT INTO user (username, name, password, gender,location)
               VALUES ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}')`;
    await db.run(createUserQuery);
    response.status(200);
    response.send("User created successfully");
  } else if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else if (UserQueryResult !== undefined) {
    response.status(400);
    response.send("User already exists");
  }
});

//login to the user

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
             SELECT 
               *
             FROM 
               user
             WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    passwordMatched = await bcrypt.compare(password, dbUser.password);
    if (passwordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//change password
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  const selectUserQueryData = `
             SELECT 
               *
             FROM 
               user
             WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQueryData);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    currentPasswordMatch = await bcrypt.compare(oldPassword, dbUser.password);

    if (currentPasswordMatch === true && newPassword.length >= 5) {
      const updatePasswordQuery = `
                           UPDATE user
                           SET 
                              password = '${hashedNewPassword}';`;
      const updatedPassword = await db.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    } else if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else if (currentPasswordMatch === false) {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
