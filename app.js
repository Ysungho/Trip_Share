const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const cookieParser = require('cookie-parser');
const passport = require("passport");
const LocalStrategy = require("passport-local");
const socket = require("socket.io");
const dotenv = require("dotenv");
const flash = require("connect-flash");
const Post = require("./models/Post");
const User = require("./models/User");

const port = process.env.PORT || 3000;//포트를 3000번으로 지정
const onlineChatUsers = {};//user의 정보를 담은 onlineChatUser 객체 변수 할당. 

dotenv.config();//.env 파일의 변수를 process.env를 통해서 사용할 수 있도록 dotenv.config 메서드 호출. 

const postRoutes = require("./routes/posts");//게시글 관련한 라우터를 postRoutes에 
const userRoutes = require("./routes/users");//사용자에 관한 라우터를 userRoutes에 분리함
const app = express();//그 이후 express를 통해서 app 변수에 담아줌. 

app.set("view engine", "ejs");//app.set을 통해 ejs를 통해서 view를 구성할 것이라고 선언. 

/* Middleware */
// cooke-parser, express-session, connect-flash 미들웨어 장착. 
// connect-flash미들웨어는 내부적으로 cookie-parser와 express-session을 사용하므로 이 둘 뒤에 작성해야함. 
// connect-flash는 req객체에 req.flash라는 프로퍼티를 생성하고 req.flash(key,value) 형태로 키에 매칭된 값을 설정한 뒤req.flash(key)로 불러와서 사용함.
app.use(cookieParser(process.env.SECRET))
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
})
);
app.use(flash());

/* Passport setup */
// passport를 설정하는 부분. 
// body parse를 위한 express의 json, urlencoded를 장착하고 정적 파일을 서비스 할 폴더를 public/ 으로 지정
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/* Middleware */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

/* MongoDB Connection */
// moongoose를 사용해서 MongoDB와 connection을 생성. 
// host는  local을 나타내는 127.0.0.1로, 포트는 MongoDB의 기본 포트인 27017로, 데이터베이스 명은 facebook_clone으로 지정함. 
// connect의 옵션으로 넣은 useNewUrlParser와 useUnifinedTopology는 true로 설정해 주지 않으면 deprecatedError가 발생함.
// 참고로 useUnifiedTopology는 Enables the new unified topology layer를 의미함. 
mongoose
    .connect("mongodb://127.0.0.1:27017/facebook_clone", {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => {
        console.log(err);
    });

/* Template 파일에 변수 전송 */
// 템플릿 파일에 user와 Authentication 그리고 flash와 관련된 변수를 전송하는 부분
app.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.login = req.isAuthenticated();
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

/* Routers */
app.use("/", userRoutes);
app.use("/", postRoutes);

const server = app.listen(port, () => {
    console.log("App is running on port " + port);
});

/* WebSocket setup */
const io = socket(server);

const room = io.of("/chat");
room.on("connection", socket => {
    console.log("new user : ", socket.id);

    // socket.io를 이용해 websocket 통신을 구현하고 http 통신ㅇ르 하는 express 서버와 연결해줌. 
    // room.emit은 모든 사용자에게 메세지를 보내는 부분임. 
    room.emit("newUser", { socketID: socket.id });

    socket.on("newUser", data => {//socket.on은 특정 이벤트에만 메시지를 보냄.

        /*새로운 사용자가 등장했을 때 (newUser), 사용자가 나갔을 때 (disconnect), 사용자들이 메시지를 보냈을 때(chat), 
          이렇게 세 가지의 상황을 구현해 주었음.*/
        if (!(data.name in onlineChatUsers)) {
            onlineChatUsers[data.name] = data.socketID;// 새로운 사용자가 들어오면(newUser) onlineChatUsers 객체 변수에 해당 사용자를 넣어줌. 
            socket.name = data.name;
            room.emit("updateUserList", Object.keys(onlineChatUsers));
            console.log("Online users: " + Object.keys(onlineChatUsers));
        }
    });

    socket.on("disconnect", () => {//socket.on은 특정 이벤트에만 메시지를 보냄.
        delete onlineChatUsers[socket.name];//사용자가 채팅방을 나가면 (disconnect) onlineChatUsers에 사용자 정보를 삭제함. 
        room.emit("updateUserList", Object.keys(onlineChatUsers));
        console.log(`user ${socket.name} disconnected`);
    });

    socket.on("chat", data => {//socket.on은 특정 이벤트에만 메시지를 보냄.
        console.log(data);
        if (data.to === "Global Chat") {
            room.emit("chat", data);
        } else if (data.to) {
            room.to(onlineChatUsers[data.name]).emit("chat", data);
            room.to(onlineChatUsers[data.to]).emit("chat", data);
        }
    });
});