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

    // req.app.db.collection('chatroom').find( { users : req.receiver_id } ).toArray().then((result)=>{
    // req.app.db.collection('chatroom').findOne( { users : req.body.receiver_id }, function(error, result){
    req.app.db.collection('chatroom').aggregate(
        [
            { $match : { users : req.user._id } },
            { $match : { users : req.body.receiver_id } }
        ]
    ).toArray(function(error, result){
        
        if (result.length) return res.redirect('/my/chat')

        req.app.db.collection('chatroom').insertOne(chatData).then((result)=>{
            res.redirect('/my/chat')
        })

    })
})

//enter the chat room & bring messages before
router.get('/chat/room/:chatroom', function(req, res){
    req.app.db.collection('message').find( { parent : req.params.chatroom } ).toArray().then((result)=>{
        res.send( { messages : result, user : req.user._id } )
    })

})

//chat - socket.io
function app2(io){

    io.on('connection', function(socket){
        console.log(socket.id, "is on socket");

        socket.on('user-join', function(data){
            var chatroomID = data;
            socket.join(chatroomID);

            console.log(socket.id, "join in", chatroomID)
        })

        socket.on('user-send', function(data){
            var chatroomID = data.chatroomID,
                message = data.message;

            io.to(chatroomID).emit('broadcast', { socketID : socket.id, message : message });

            console.log(socket.id, "send a message that is", "'", message, "' in", chatroomID)
            

        })



    })

    return router
}


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


// //show a chat room
// router.get('/chat/room/:chatroom', function(req, res){

//     res.writeHead(200, {
//         "Connection" : "keep-alive",
//         "Content-Type" : "text/event-stream",
//         "Cache-Control" : "no-cache",
//     });

//     req.app.db.collection('message').find( { parent : req.params.chatroom } ).toArray().then((result)=>{
//         result[result.length] = req.user._id;
//         res.write('event: test\n'); //event : test\n 이케 쓰면 안 된다? event랑 : 사이에 스페이스 있으면 안 된다?ㄹ??????/
//         res.write('data: ' + JSON.stringify(result) + '\n\n');
//     })

//     const pipeline = [
//         { $match: { 'fullDocument.parent' : req.params.chatroom } }
//     ];

//     const collection = req.app.db.collection('message');
//     const changeStream = collection.watch(pipeline);
//     changeStream.on('change', (result)=>{

//         var data = [result.fullDocument];
//         data[data.length] = req.user._id;
        
//         res.write('event: test\n');
//         res.write('data: ' + JSON.stringify(data) + '\n\n');
//     });

// });


module.exports = app2;

function signedIn(req, res, next){
    if (req.user){
        req.user._id = req.user._id.toString();
        next()
    } else {
        res.status(400).send("<script>alert('로그인을 해주세요.'); history.back();</script>");
    }
}



