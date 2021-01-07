const path = require("path");
const fs = require("fs");
const jsonServer = require("json-server");
const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, "db.json"));
const middleWares = jsonServer.defaults();
server.use(jsonServer.bodyParser);
server.use(middleWares);

//   取得 users.json 資料
const getUsersDb = () => {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "users.json"), "UTF-8")
  );
};


//   傳遞的資料是否與 users.json 符合
const isAuthenticated = ({ email, password }) => {
  return (
  getUsersDb().users.findIndex(
      user => user.email === email && user.password === password
    ) !== -1
  );
};




server.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (isAuthenticated({ email, password })) {
    const jwToken = "sfsfsgsghhhsd.1454564dsdsfggg.sfsf44";
    return res.status(200).json(jwToken);
  } else {
    const status = 401;
    const message = "Incorrect email or password";
    return res.status(status).json(status, message);
  }
});

server.use(router);
server.listen(3003, () => {
  console.log("JSON Server is running");
});
