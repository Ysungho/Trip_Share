// 사용자와 게시글의 비지니스 로직을 만들어줄 user.js 파일

const express = require("express");
const User = require("../models/User");
const passport = require("passport");
const multer = require("multer");
const cloudinary = require("cloudinary");
const router = express.Router();

/* Multer setup */
const storage = multer.diskStorage({// multer를 이용해서 저장 경로와 파일명을 처리하기 위해 diskStroage() 메서드를 사용함. 
    filename: (req, file, callback) => {// coludaniary라는 모듈을 사용해서 파일을 저장할 것이기 때문에, 경로는 설정 안하고 filename만 설정함. 
        // diskStorage()의 인자로 객체를 보내주는데, filename이라는 키 값은 함수이며, 이 함수의 인자인 callback을 통해 정송된 파일명을 설정함 
        callback(null, Date.now() + file.originalname);
    }
});

const imageFilter = (req, file, callback) => {// imageFilter는 파일의 확장자를 확인하는 부분임. 
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
        // 만약에 확장자가 올바르지 않는 경우 메시지와 함께 오류 객체를 담은 콜백 함수를 반환함. 
        return callback(new Error("Only image files are allowed!"), false);
    }
    callback(null, true);
};

// upload 변수에 multer의 인스턴스를 생성해 줌. 
// 인자로 넘긴 옵션으로 storage, '파일이 저장할 위치'를 지정하는 옵션과 fileFilter '어떤 파일을 허용할지 제어' 하는 옵션을 넣어줌. 
const upload = multer({ storage: storage, fileFilter: imageFilter });

/* Cloudinary setup */
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/* Middleware */
// 로그인 하지 않은 사용자를 체크하는 미들웨어 부분. 
const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    // 로그인 하지 않은 사용자라면 flash 오류 메시지를 보냄. 
    req.flash("error", "You need to be logged in to do that!");

    // /user/login 로그인 화면으로 리다이랙팅 하는 기능
    // 필요한 ㅏㄹ우터에 인자로 넣어 로그인이 필요한 동작(프로필 조회, 친구 추가 등)을 할 경우 로그인을 확인하는 역할. 
    res.redirect("/user/login");
};

/* Routers */

/* User Routers, 회원가입을 위한 라우터 */
router.post("/user/register", upload.single("image"), (req, res) => {
    if (
        req.body.username &&
        req.body.firstname &&
        req.body.lastname &&
        req.body.password
    ) {
        // 회원가입을 통해서 들어온 req.body 객체의 username, firstname, lastname, password를 받고 newUser 객체에 넣어줌. 
        let newUser = new User({
            username: req.body.username,
            firstName: req.body.firstname,
            lastName: req.body.lastname
        });
        if (req.file) {
            // 처음 회원 가입을 할 때 프로필 이미지를 받고 이를 multer를 통해 req.file에 설정함. 
            cloudinary.uploader.upload(req.file.path, result => {
                newUser.profile = result.secure_url;
                // cloudinary를 이용해서 파일을 업로드하고 사용자 프로필을 설정한 뒤, createUser() 함수를 통해서 사용자 인스턴스 생성
                // 만약 프로필 사진이 없다면 DEFAULT_PROFILE_PIC을 프로필 사진으로 지정. 
                return createUser(newUser, req.body.password, req, res);
            });
        } else {
            newUser.profile = process.env.DEFAULT_PROFILE_PIC;
            return createUser(newUser, req.body.password, req, res);
        }
    }
});

function createUser(newUser, password, req, res) {
    User.register(newUser, password, (err, user) => {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/");
        } else {
            // /user/register 라우터에서 받은 newUser 객체와 비밀번호를 인자로 받아 USer 모델에 넣음
            // passport를 통해 authenticate()로 인증을 수행함. 
            passport.authenticate("local")(req, res, function () {
                console.log(req.user);
                req.flash(// 오류 메시지는 connect-flash를 모듈의 flash()를 통해 보내줌. 
                    "success",
                    "Success! You are registered and logged in!"
                );
                res.redirect("/");
            });
        }
    });
}

// Login, 로그인 하는 라우터
router.get("/user/login", (req, res) => {// get 방식을 통해서 views/users/login.ejs 파일을 렌더링함. 
    res.render("users/login");
});

router.post(// post방식을 통새 passport 인증을 함.  
    "/user/login",
    passport.authenticate("local", {
        successRedirect: "/",// 성공할 경우 '/' 페이지로 이동
        failureRedirect: "/user/login"// 실패할 경우 '/user/login' 을 띄움. 
    }),
    (req, res) => { }
);

// All users, 로그인한 모든 사용자를 보여주는 라우터
router.get("/user/all", isLoggedIn, (req, res) => {// 모든 사용자를 User.find() 함수를 통해 조회. 
    User.find({}, (err, users) => {
        if (err) {
            console.log(err);
            req.flash(
                "error",
                "There has been a problem getting all users info."
            );
            res.redirect("/");// 'views/users/users.ejs에 users 객체를 보내주로 렌더링함. 
        } else {
            res.render("users/users", { users: users });
        }
    });
});

// Logout, 로그아웃 하는 라우터
router.get("/user/logout", (req, res) => {// passport가 req 객체에 logout() 메서드를 만들어 주고 이를 이용함. 
    req.logout();
    res.redirect("back");
});

// User Profile, 사용자의 프로필을 생성하는 역할. 
router.get("/user/:id/profile", isLoggedIn, (req, res) => {
    User.findById(req.params.id)
    // req.params 객체에 있는 id를 통해 현재 사용자를 조회함. 
    // moongoose의 populate() 메서드를 통해 friends, friendRequest, post 필드의 Document를 조회함. 
    // populate()는 Document가 다른 Document의 ObjectID를 사용할 경우 실제 객체가 어떤 것인지 찾아서 바꿔주는 역할을 함. 
    // populate를 위해 데이터 모델을 만드는 부분(models/)에서 필드를 생성할 때 mongoose.Schema.Types,ObjectId, req:something을 통해 다른 Document와 매핑한 것임. 
        .populate("friends")
        .populate("friendRequests")
        .populate("posts")
        .exec((err, user) => {// exec()를 통해 결과인 user를 콜백으로 넘겨줌. 
            if (err) {
                console.log(err);
                req.flash("error", "There has been an error.");
                res.redirect("back");
            } else {
                console.log(user);
                
                res.render("users/user", { userData: user });// 해당 결과를 'views/users/user.ejs'화면에서 받아 렌더링 할 수 있게 함
            }
        });
});

// Add Friend, 친구 추가 기능을 하는 라우터
// :id  부분이 req.parmas로 들어오고, 들어온 id 값을 이용해서 사용자를 찾는다(findById)
// 해당 사용자의 아이디를 찾을 수 없는 경우, 이미 친구인 경우, 이미 친구 추가 요청을 보낸 경우를 'if/else'분기 처리를 통해 처리한다. 
router.get("/user/:id/add", isLoggedIn, (req, res) => {
    User.findById(req.user._id, (err, user) => {
        if (err) {
            console.log(err);
            req.flash(
                "error",
                "There has been an error adding this person to your friends list"
            );
            res.redirect("back");
        } else {
            User.findById(req.params.id, (err, foundUser) => {
                if (err) {
                    console.log(err);
                    req.flash("error", "Person not found");
                    res.redirect("back");
                } else {
                    if (
                        foundUser.friendRequests.find(o =>
                            o._id.equals(user._id)
                        )
                    ) {
                        req.flash(
                            "error",
                            `You have already sent a friend request to ${user.firstName
                            }`
                        );
                        return res.redirect("back");
                    } else if (
                        foundUser.friends.find(o => o._id.equals(user._id))
                    ) {
                        req.flash(
                            "error",
                            `The user ${foundUser.firstname
                            } is already in your friends list`
                        );
                        return res.redirect("back");
                    }
                    let currUser = {
                        _id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName
                    };
                    // 모든 조건이 맞는 경우, 요청을 보낸 친구는 foundUser를 freidRequest에 추가한다. 
                    foundUser.friendRequests.push(currUser);
                    foundUser.save();
                    req.flash(
                        "success",
                        `Success! You sent ${foundUser.firstName
                        } a friend request!`
                    );
                    res.redirect("back");
                }
            });
        }
    });
});

// Accept friend request, 요청 받은 친구 추가 요청ㅇ르 사용자가 수락하는 부분을 다루는 라우터. 
// findById()메서드를 통해 요청한 친구의 id를 User Collection에서 조회하고 해당 사용자의 friends 키 값에 추가한 친구를 업데이트 한다. 
router.get("/user/:id/accept", isLoggedIn, (req, res) => {
    User.findById(req.user._id, (err, user) => {
        if (err) {
            console.log(err);
            req.flash(
                "error",
                "There has been an error finding your profile, are you connected?"
            );
            res.redirect("back");
        } else {
            User.findById(req.params.id, (err, foundUser) => {
                let r = user.friendRequests.find(o =>
                    o._id.equals(req.params.id)
                );
                if (r) {
                    let index = user.friendRequests.indexOf(r);
                    user.friendRequests.splice(index, 1);
                    let friend = {
                        _id: foundUser._id,
                        firstName: foundUser.firstName,
                        lastName: foundUser.lastName
                    };
                    user.friends.push(friend);
                    user.save();

                    let currUser = {
                        _id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName
                    };
                    foundUser.friends.push(currUser);
                    foundUser.save();
                    req.flash(
                        "success",
                        `You and ${foundUser.firstName} are now friends!`
                    );
                    res.redirect("back");
                } else {
                    req.flash(
                        "error",
                        "There has been an error, is the profile you are trying to add on your requests?"
                    );
                    res.redirect("back");
                }
            });
        }
    });
});

// Decline friend Request, 친구 추가 요청을 거절하는 부분을 다룬 라우터. 
// req.param로 들어온 id 값을 이요해서 사용자를 찾는다(findById)
// user의 friendRequest를 삭제해서 해당 요청을 거부한다. 
router.get("/user/:id/decline", isLoggedIn, (req, res) => {
    User.findById(req.user._id, (err, user) => {
        if (err) {
            console.log(err);
            req.flash("error", "There has been an error declining the request");
            res.redirect("back");
        } else {
            User.findById(req.params.id, (err, foundUser) => {
                if (err) {
                    console.log(err);
                    req.flash(
                        "error",
                        "There has been an error declining the request"
                    );
                    res.redirect("back");
                } else {
                    // remove request
                    let r = user.friendRequests.find(o =>
                        o._id.equals(foundUser._id)
                    );
                    if (r) {
                        let index = user.friendRequests.indexOf(r);
                        user.friendRequests.splice(index, 1);
                        user.save();
                        req.flash("success", "You declined");
                        res.redirect("back");
                    }
                }
            });
        }
    });
});

/* Chat Routers, 채팅방의 로직을 구현하는 부분 */
router.get("/chat", isLoggedIn, (req, res) => {
    User.findById(req.user._id)
        .populate("friends")// User컬렉션에서 user를 찾고, 해당 user의 friends 값을 populate()를 통해 접근한다. 
        .exec((err, user) => {
            if (err) {
                console.log(err);
                req.flash(
                    "error",
                    "There has been an error trying to access the chat"
                );
                res.redirect("/");
            } else {
                res.render("users/chat", { userData: user });// 접근하고 가져온 데이터를 'views/users/chat,ejs'에 보내주고 렌더링 하는 부분. 
            }
        });
});

module.exports = router;// 작성한 모든 라우터를 module.exports를 통해 app.js에서 사용할 수 있게 해준다. 