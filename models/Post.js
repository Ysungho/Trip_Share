// 게시글 관련 데이터 Collection의 스키마를 정의할 Post.js  파일

const mongoose = require("mongoose");

// content, time, likes, images 같은 Post 컬렉션만 가지고 있는 고유 속성(필드, 키)와 필드 타입을 정의 함. 
let PostSchema = new mongoose.Schema({ // 게시물 스키마
    content: String,
    time: Date,
    likes: Number,
    image: String,
    creator: {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        firstName: String,
        lastName: String,
        profile: String
    },
    comments: [
        {
            // creator, comments 속성(필드, 키)은 User 컬렉션의 Document와 Comment 컬렉션의 Document와 매핑해줌. 
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});

let Post = mongoose.model("Post", PostSchema);
module.exports = Post;