// 댓글 관련 데이터를 관리하는 Comment Collection을 생성하는 Comment.js

const mongoose = require("mongoose");

let CommentSchema = new mongoose.Schema({ // 댓글용 스키마
    content: String,
    likes: Number,
    creator: {
        // creator 필드 안에 _id라는 필드는 User 컬렉션의 Document와 매핑시켰고, firstName, lastName 필드를 추가함. 
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        firstName: String,
        lastName: String
    }
});

let Comment = mongoose.model("Comment", CommentSchema);

module.exports = Comment;