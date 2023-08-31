// 사용자의 데이터를 스키마에 담고 있는 User.js

const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

let UserSchema = new mongoose.Schema({ // 사용자 스키마, UserSchema를 정의함. 
    // 데이터의 속성을 moogoose에서는 key로 나타내며 이를 Field라고 함. 
    // User데이터 모델에 username, firstName, lastName, passord, profile 이라는 속성을 가질 수 있도록 field값을 설정하고 각 키에 타입(String)을 지정함.
    username: String,
    firstName: String,
    lastName: String,
    password: String,
    profile: String,
    posts: [
        {
            // ObjectID는 각각의 Document를 식별하는 고유의 아이디. 이를 통해서 다른 collection의 document와 매칭될 수 있음.
            // 즉 User Collection에 있는 posts필드는 Post Collection에 있는 Document와 매핑 될 수 있음.
            // 관계형 데이터베이스에서 외래 키를 이용해 RElation을 맺는 것임. 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Post"
        }
    ],

    liked_posts: [
        {
            // ObjectID는 각각의 Document를 식별하는 고유의 아이디. 이를 통해서 다른 collection의 document와 매칭될 수 있음.
            // 즉 User Collection에 있는 posts필드는 Post Collection에 있는 Document와 매핑 될 수 있음.
            // 관계형 데이터베이스에서 외래 키를 이용해 RElation을 맺는 것임. 
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        }
    ],

    liked_comments: [
        {
            // ObjectID는 각각의 Document를 식별하는 고유의 아이디. 이를 통해서 다른 collection의 document와 매칭될 수 있음.
            // 즉 User Collection에 있는 posts필드는 Post Collection에 있는 Document와 매핑 될 수 있음.
            // 관계형 데이터베이스에서 외래 키를 이용해 RElation을 맺는 것임. 
            type: mongoose.Schema.Types.ObjectId,
        }
    ],
    friends: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    friendRequests: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
});

// UserSchema.plugin() 메서드를 사용해서 사용자 인증을 위한 passport-local-mongoose 모듈과 스키마를 연결해줌. 
UserSchema.plugin(passportLocalMongoose);
let User = mongoose.model("User", UserSchema);
module.exports = User;