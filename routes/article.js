const { send } = require('express/lib/response');

var router = require('express').Router();

// router.use('/shirts', signedIn); // shirts 라우트에만 signedIn 미들 웨어 적용

router.use(signedIn); // 이 파일에 있는 모든 라우터에 signedIn 미들 웨어 적용

router.get('/write', function(req, res){
    res.render('article/write.ejs');
})

router.post('/add', function(req, res){
    req.app.db.collection('counter').findOne({ name : 'totalPost' }, function(error, result){
        if (error) return res.render('fail.ejs')

        var totalPost = result.totalPost;
        var postData = {
            _id : totalPost + 1 ,

            board : req.body.board,
            open : req.body.open,

            title : req.body.title,
            content : req.body.content,
            date : new Date().toLocaleString(),

            user : req.user._id,
            nick : req.user.nick
        }

        req.app.db.collection('post').insertOne(postData, function(error, result){
            
            req.app.db.collection('counter').updateOne({ name : 'totalPost' }, { $inc: { totalPost : 1 } }, function(error, reuslt){
                if (error) return res.render('fail.ejs')

                res.redirect('/article/write')

            });

        });

    });

})

router.delete('/delete', function(req, res){
    req.body._id = parseInt(req.body._id);
    var deleteData = { _id : req.body._id, user : req.user._id }

    // req.app.db.collection('post').findOne(deleteData, function(error, result){
    //     console.log(result);
        // if (result.userID != req.user.id) return res.status(400).send({ message : "fail" });
        req.app.db.collection('post').deleteOne(deleteData, function(error, result){
            if (error) return res.status(400).send({ message : "fail" });
            if (!result.deletedCount) return res.status(400).send("<script>alert('존재하지 않는 게시글입니다.'); history.back();</script>");

            res.status(200).send({ message : "success" });
        })
    // })
})

router.get('/edit/:id', function(req, res){
    var editData = { _id : parseInt(req.params.id) }
    req.app.db.collection('post').findOne(editData, function(error, result){
        if (!result) return res.send("<script>alert('권한이 없습니다.'); history.back();</script>");
        res.render('article/edit.ejs', { post : result });
    })
})

router.put('/edit', function(req, res){
    var editContents = {
        title : req.body.title,
        content : req.body.content,
        open : req.body.open
    }

    req.app.db.collection('post').updateOne({ _id : parseInt(req.body.id) }, { $set: editContents }, function(error, result){
        if (error) return res.render('fail.ejs');
        res.redirect('/board/' +  req.body.board + '/detail/' + req.body.id)
    });

})

router.post('/comment', function(req, res){

    var commentData = {
        comment : req.body.comment,
        post : parseInt(req.body.post),
        user : req.user._id,
        nick : req.user.nick,
        date : new Date().toLocaleString()
    }

    req.app.db.collection('comment').insertOne(commentData, function(error, result){
        if (error) { return res.render('fail.ejs') }
        res.send("<script>location.replace(document.referrer);</script>")
    })
})


module.exports = router;

function signedIn(req, res, next){
    if (req.user){
        req.user._id = req.user._id.toString();
        next()
    } else {
        res.status(400).send("<script>alert('로그인을 해주세요.'); history.back();</script>");
    }
}