require('dotenv').config()

const { response } = require('express');
const express = require('express');
const app = express();

//socket.io
const http = require('http').createServer(app);
const {Server} = require('socket.io');
const io = new Server(http);

//
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));

app.set('view engine', 'ejs');

app.use('/public', express.static('public'));

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

const MongoClient = require('mongodb').MongoClient;
// const { ObjectId } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
app.ObjectId = ObjectId

var db;
MongoClient.connect(process.env.DB_URL, function(error, client){
    if(error) return console.log(error)

    db = client.db('todoapp2');
    app.db = db;

    // app.listen(process.env.PORT, function(){
    http.listen(process.env.PORT, function(){
            console.log('listening on ' + process.env.PORT);
    });

})

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const { localsName } = require('ejs');
const { redirect } = require('express/lib/response');

app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 

// ----------my routes----------

app.use('/article', require('./routes/article.js'));
app.use('/board', require('./routes/board.js'));
app.use('/my', require('./routes/my.js'));
// app.use('/sign', require('./routes/sign.js'));

// -----------------------------

app.get('/button', function(req, res){
    res.send("?????????")
    // res.render('button.ejs');
})

app.get('/fail', function(req, res){
    res.render('fail.ejs');
})

app.get('/', function(req, res){
    res.render('index.ejs');
})

app.get('/sign/in', function(req, res){
    res.render('sign/in.ejs')
})

app.post('/sign/in', passport.authenticate('local', {
    failureRedirect : '/fail'
}),function(req, res){
    res.redirect('/my/page')
})

app.get('/sign/up', function(req, res){
    res.render('sign/up.ejs')
})

app.post('/sign/up', function(req, res){
    db.collection('signin').findOne( { id : req.body.email }, function(error, result){
        if (error) return res.render('fail.ejs')

        if (result) return res.send("<script>alert('이미 가입한 이메일입니다.'); history.back();</script>");

        db.collection('signin').findOne( { nick : req.body.nickname }, function(error, result){
            if (result) return res.send("<script>alert('아이디 중복을 확인하세요.'); history.back();</script>");

            var memberInfo = {
                id : req.body.email,
                pw : req.body.pw,
                nick: req.body.nickname
            }

            db.collection('signin').insertOne(memberInfo, function(error, result){
                if (error) return res.render('fail.ejs');
                res.redirect('/sign/in');
            })
        })
        // db.collection('signin').insertOne({
        //     id : req.body.email,
        //     pw : req.body.pw,
        //     nick: req.body.nickname
        // }, function(error, result){

        //     if (error) return res.render('fail.ejs');
        //     res.redirect('/sign/in')

        // });
    })
})

app.post('/sign/up/nickCheck', function(req, res){
    db.collection('signin').findOne( { nick : req.body.nick }, function(error, result){
        if (error) return res.render('fail.ejs')
        if (result) return res.send(400)
        res.send(200)
    })
})

app.get('/upload', function(req, res){
    res.render('article/upload.ejs');
})

let multer = require('multer');
const { serializeUser } = require('passport');
var storage = multer.diskStorage({ //memorystorage는 램제 저장(휘발성)
    destination : function(req, file, cb){
        cb(null, './public/image')
    },
    filename : function(req, file, cb){
        cb(null, file.originalname)
    }
    // filefilter : function(req, file, cb){
    //     //imagea만 올리세여! 머 그런 거 가능
    // },
    // limits : // v파일 사이즈 제한 같은 거 가능!
});

var upload = multer({storage : storage});

app.post('/upload', upload.single('profil'), function(req, res){ //profil = input's name
    res.send('upload good~')
})

app.get('/image/:imageName', function(req, res){
    res.sendFile( __dirname + '/public/image/' + req.params.imageName )
})

//파일 여러개 업로드하는 방법(upload.ejs의 input도 바꿔저야함 여러개 선택할 수 있도록)
// app.post('/upload', upload.array('profil', 10), function(req, res){ //profil = input's name
//     res.send('upload good~')
// })




















function signedIn(req, res, next){
    if (req.user){
        req.user._id = req.user._id.toString();
        next()
    } else {
        res.status(400).send("<script>alert('로그인을 해주세요.'); history.back();</script>");
    }
}

passport.use(new LocalStrategy({
    usernameField: 'id', //form 태그 안의 name이 id인 input의 값
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
    }, function (입력한아이디, 입력한비번, done) {
        //console.log(입력한아이디, 입력한비번);
        db.collection('signin').findOne({ id: 입력한아이디 }, function (error, result) {
            if (error) return done(error)

            if (!result) return done(null, false, { message: '존재하지않는 아이디요' })
            if (입력한비번 == result.pw) {
                return done(null, result)
            } else {
                return done(null, false, { message: '비번틀렸어요' })
            }
        })
    }));

passport.serializeUser(function(user, done){
    done(null, user.id)
});

passport.deserializeUser(function(id, done){
    //디비에서 위에 있는 user.id로 유저를 찾은 뒤에 유저 정보를
    db.collection('signin').findOne({ id : id }, function(error, result){
        done(null, result)
    })
});



















// app.get('/article/search', function(req, res){
//     var path;
//     if (req.query.what == '제목') path = "title";
//     else if (req.querywhat == '내용') path = "content";
//     else path = ["title", "content"];

//     var searchObj = [
//         {
//             $search: {
//                 index: 'search', //mongoDB 에서 설정한 index 이름
//                 text: {
//                     query: req.query.query,
//                     path: path
//                 }
//             }
//         },
//         // { $project : { title: 1, _id: 0, score: { $meta: "searchScore"} } },
//         { $sort : { _id : 1 } },
//         { $limit : 5 }
//     ]
//     db.collection('post').aggregate(searchObj).toArray(function(error, result){
//         if (error) return res.render('fail.ejs')
//         if (!result.length) return res.send("<script>alert('게시글이 존재하지 않습니다..'); history.back();</script>");
//         res.render('article/search.ejs', { posts : result })
//     })

// })


// app.get('/write', signedIn, function(req, res){
//     res.render('write.ejs');
// })

// app.post('/add', signedIn, function(req, res){

//     db.collection('counter').findOne({ name : 'totalPost' }, function(error, result){
//         if (error) return res.render('fail.ejs')

//         var totalPost = result.totalPost;
//         var postData = {
//             _id : totalPost + 1 ,
//             title : req.body.title,
//             content : req.body.content,
//             date : new Date().toLocaleString(),
//             userID : req.user.id,
//             userName : req.user.lastName,
//             open : req.body.open
//         }

//         db.collection('post').insertOne(postData, function(error, result){
            
//             db.collection('counter').updateOne({ name : 'totalPost' }, { $inc: { totalPost : 1 } }, function(error, reuslt){
//                 if (error) return res.render('fail.ejs')

//                 res.redirect('/write')

//             });

//         });

//     });

// })

// app.get('/board/list', function(req, res){
//     db.collection('post').find().sort({ "_id" : -1 }).toArray(function(error, result){
//         if (error) return res.render('fail.ejs')
//         res.render('./board/list.ejs', { posts : result, user : req.user });        
//     });
// })

// app.delete('/delete', signedIn, function(req, res){
//     req.body._id = parseInt(req.body._id);
//     var deleteData = { _id : req.body._id, userID : req.user.id }

//     // db.collection('post').findOne(deleteData, function(error, result){
//     //     console.log(result);
//         // if (result.userID != req.user.id) return res.status(400).send({ message : "fail" });
//         db.collection('post').deleteOne(deleteData, function(error, result){
//             if (error) return res.status(400).send({ message : "fail" });
//             if (!result.deletedCount) return res.status(400).send("<script>alert('존재하지 않는 게시글입니다.'); history.back();</script>");

//             res.status(200).send({ message : "success" });
//         })
//     // })
// })

// app.get('/board/detail/:id', function(req, res){
//     db.collection('post').findOne({ _id : parseInt(req.params.id) }, function(error, result){
//         if (!result) return res.send("<script>alert('존재하지 않는 게시글입니다.'); history.back();</script>");

//         if (result.open == 'member' && !req.user) return res.send("<script>alert('회원만 볼 수 있는 게시글입니다.'); history.back();</script>");

//         res.render('board/detail.ejs', { post : result, user : req.user });
//     })
// })

// app.get('/edit/:id', signedIn, function(req, res){
//     var editData = { _id : parseInt(req.params.id), userID : req.user.id }
//     db.collection('post').findOne(editData, function(error, result){
//         if (!result) return res.send("<script>alert('권한이 없습니다.'); history.back();</script>");
//         res.render('edit.ejs', { post : result });
//     })
// })

// app.put('/edit', function(req, res){
//     var editContents = {
//         title : req.body.title,
//         content : req.body.content,
//         open : req.body.open
//     }

//     db.collection('post').updateOne({ _id : parseInt(req.body.id) }, { $set: editContents }, function(error, result){
//         if (error) return res.render('fail.ejs');
//         res.redirect('/detail/' + req.body.id)
//     });

// })

app.get('/socket', function(req, res){
    res.render('socket.ejs')
})

io.on('connection', function(socket){
    console.log("=================user on===============");
    console.log(socket.id)

    //1:1
    socket.on('personalChat', function(data){
        io.to(socket.id).emit('broadcast-one', data)
    })

    //단체
    socket.on('groupChat', function(data){
        io.emit('broadcast-all', data)
    })

    //join room1 ?? make a room1?
    socket.on('room1-join', function(){
        console.log(socket.id + " enter in room1");
        socket.join('room1');
    })

    //message room1
    socket.on('room1-send', function(data){
        io.to('room1').emit('broadcast-room1', data)
    })


})