var router = require('express').Router();

router.use(signedIn); // 이 파일에 있는 모든 라우터에 signedIn 미들 웨어 적용

router.get('/page', function(req, res){
    res.render('my/page.ejs', { user : req.user })
})

//render chat page
router.get('/chat', function(req, res){

    req.app.db.collection('chatroom').find( { users : req.user._id} ).toArray().then((result)=>{
        res.render('my/chat.ejs', { chatroom : result, user : req.user._id })
    })
})

//make a chat room
router.post('/chat', function(req, res){
    var chatData = {
        users : [req.body.receiver_id, req.user._id], //receiver, caleer
        nicks : [req.body.receiver_nick, req.user.nick],
        date : new Date().toLocaleString(),
        title : 'chat'
    }

    req.app.db.collection('chatroom').insertOne(chatData).then((result)=>{
        res.redirect('/my/chat')
    })
})

//show a chat room
router.post('/chat/room/:chatroom', function(req, res){
    req.app.db.collection('message').find( { parent : req.params.chatroom } ).toArray().then((result)=>{
        res.send( { messages : result, user : req.user._id } )
    })
})

//send a message
router.post('/chat/message', function(req, res){
    var inserData = {
        parent :  req.body.parent,
        content : req.body.content,
        userid : req.user._id,
        date : new Date().toLocaleString(),
    }

    req.app.db.collection('message').insertOne(inserData).then(()=>{
        res.send('ohoh')
    }).catch(()=>{
        res.send('nono..');
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