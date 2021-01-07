const path = require("path");
const fs = require("fs");
const jsonServer = require("json-server");
const jwt = require("jsonwebtoken");
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
//   驗證 email password 是否重複
const isAuthenticated = ({ email, password }) => {
  return (
    getUsersDb().users.findIndex(
      (user) => user.email === email && user.password === password
    ) !== -1
  );
};

// 驗證 email 是否重複
const isExist = ({ email }) => {
  return getUsersDb().users.findIndex((user) => user.email === email) !== -1;
};

// Jwt 註冊
const SECRET = "12321JKLSJKLSDFJK23423432";
const expiresIn = "1h";
const createToken = (payload) => {
  return jwt.sign(payload, SECRET, { expiresIn });
};

//   資料 與 users驗證
server.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (isAuthenticated({ email, password })) {
    const user = getUsersDb().users.find(
      (u) => u.email === email && u.password === password
    );

    const { nickname, type } = user;

    //   jwt
    const jwToken = createToken({ nickname, type, email });
    return res.status(200).json(jwToken);
  } else {
    const status = 401;
    const message = "Incorrect email or password";
    return res.status(status).json(status, message);
  }
});

//  註冊新用戶
// 拿取用戶註冊資料
server.post("/auth/register", (req, res) => {
  const { email, password, nickname, type } = req.body;

  // 1 比對  email 已經註冊  return 401
  if (isExist(email)) {
    const status = 401;
    const message = "Email already exist";
    return res.status(status).json({ status, message });
  }

  //  2
  fs.readFile(path.join(__dirname, "users.json"), (err, _data) => {
    if (err) {
      const status = 401;
      const message = err;
      return res.status(status).json({ status, message });
    }
    // Get current users data
    const data = JSON.parse(_data.toString());
    // Get the id of last user
    const last_item_id = data.users[data.users.length - 1].id;
    //Add new user
    data.users.push({ id: last_item_id + 1, email, password, nickname, type }); //add some data
    fs.writeFile(
      path.join(__dirname, "users.json"),
      JSON.stringify(data),
      (err, result) => {
        // WRITE
        if (err) {
          const status = 401;
          const message = err;
          res.status(status).json({ status, message });
          return;
        }
      }
    );
  });

  // 生成 token 給 新用戶
  const jwToken = createToken({ nickname, type, email });
  res.status(200).json(jwToken);
});

// ---------------

// server.use(/^(?!\/auth).*$/, (req, res, next) => {
// 多個
// server.use(['/carts'], (req, res, next) => {

server.use("/carts", (req, res, next) => {
  if (
    req.headers.authorization === undefined ||
    req.headers.authorization.split(" ")[0] !== "Bearer"
  ) {
    const status = 401;
    const message = "Error in authorization format";
    res.status(status).json({ status, message });
    return;
  }
  try {
    const verifyTokenResult = verifyToken(
      req.headers.authorization.split(" ")[1]
    );
    if (verifyTokenResult instanceof Error) {
      const status = 401;
      const message = "Access token not provided";
      res.status(status).json({ status, message });
      return;
    }
    // next() 繼續處理原本 carts的請求
    next();
  } catch (err) {
    const status = 401;
    const message = "Error token is revoked";
    res.status(status).json({ status, message });
  }
});
// 驗證 token
const verifyToken = (token) => {
  return jwt.verify(token, SECRET, (err, decode) =>
    decode !== undefined ? decode : err
  );
};

server.use(router);
server.listen(3003, () => {
  console.log("JSON Server is running");
});
