var router = require('express').Router();

// router.use('/shirts', signedIn); // shirts 라우트에만 signedIn 미들 웨어 적용

router.use(notSignedIn); // 이 파일에 있는 모든 라우터에 signedIn 미들 웨어 적용

router.get('/:board', function(req, res){
    var board = req.params.board;
    if ( board == 'total' ){
        req.app.db.collection('post').find().sort({ "_id" : -1 }).toArray(function(error, result){
            if (error) return res.render('fail.ejs')
            res.render('./board/list.ejs', { posts : result, user : req.user._id, board : board, search : undefined })       
        });
    } else {
        req.app.db.collection('post').find({ board : board }).sort({ "_id" : -1 }).toArray(function(error, result){
            if (error) return res.render('fail.ejs')
            res.render('./board/list.ejs', { posts : result, user : req.user._id, board : board, search : undefined })       
        });
    }
})

router.get('/:board/detail/:id', function(req, res){

    var postResult, commentResult

    req.app.db.collection('post').findOne({ _id : parseInt(req.params.id) }, function(error, result){
        if (error) return res.render('fail.ejs')
        if (!result) return res.send("<script>alert('존재하지 않는 게시글입니다.'); history.back();</script>");

        if (result.open == 'member' && !req.user.id) return res.send("<script>alert('회원만 볼 수 있는 게시글입니다.'); history.back();</script>");

        postResult = result;

        req.app.db.collection('comment').find({ post : parseInt(req.params.id) }).toArray(function(error, result){
            commentResult = result;
            res.render('board/detail.ejs', { post : postResult, comments : commentResult, user : req.user._id });
        })
    })
})

// router.get('/:board/detail/:id', function(req, res){
    
//     req.app.db.collection('post').findOne({ _id : parseInt(req.params.id) }, function(error, result){
//         if (!result) return res.send("<script>alert('존재하지 않는 게시글입니다.'); history.back();</script>");

//         if (result.open == 'member' && !req.user) return res.send("<script>alert('회원만 볼 수 있는 게시글입니다.'); history.back();</script>");

//         if (!req.user) { var userID = undefined }
//         else { var userID = req.user.id }

//         res.render('board/detail.ejs', { post : result, userID : userID });
//     })
// })

router.get('/:board/search', function(req, res){
    var path;
    if (req.query.what == '제목') path = "title";
    else if (req.querywhat == '내용') path = "content";
    else path = ["title", "content"];

    var searchObj = [
        {
            $search: {
                index: 'search', //mongoDB 에서 설정한 index 이름
                text: {
                    query: req.query.query,
                    path: path
                }
            }
        },
        // { $project : { title: 1, _id: 0, score: { $meta: "searchScore"} } },
        { $sort : { _id : 1 } },
        { $limit : 5 }
    ]
    req.app.db.collection('post').aggregate(searchObj).toArray(function(error, result){
        if (error) return res.render('fail.ejs')
        // if (!result.length) return res.send("<script>alert('게시글이 존재하지 않습니다..'); history.back();</script>");
        res.render('board/list.ejs', { posts : result, user : req.user, board : req.params.board, search : req.query.query })
    })

})

module.exports = router;

function signedIn(req, res, next){
    if (req.user){
        next()
    } else {
        res.status(400).send("<script>alert('로그인을 해주세요.'); history.back();</script>");
    }
}

function notSignedIn(req, res, next){
    if (!req.user) {
        req.user = {};
    }
    next()
}