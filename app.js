var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var bodyParser = require('body-parser');
var ueditor = require("ueditor");
var config = require('./routes/config/config');

/**
 * load all router
 */
const frontendRouter = require('./routes/frontend');
const backendRouter = require('./routes/backend/backend');
const loginRouter = require('./routes/login');
const logoutRouter = require('./routes/logout');
const registerRouter = require('./routes/register');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
// app.use(express.json());
app.use(bodyParser.json());
// app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// set the uploaded file path
app.use("/uploads", express.static("uploads"))

app.use(session({
  secret: 'recommand 128 bytes random string', // a 128 random character string is recommended
  cookie: { maxAge: 20 * 60 * 1000 }, // Cook life cycle 20*60 seconds
  resave: true, // Request rules between cookies, assuming that every login, even if the session exists, is saved again
  saveUninitialized: true // Force to save uninitialized sessions to memory
}));

/**
 * login intercetor
 * redirect to the login page if it access the pages under the /backend without
 * signing in
 */
app.use(function (req, res, next) {
  let __url = req.originalUrl;
  let __arr = __url.split("/");
  // console.log(__arr, req.session.isLogin);
  if (__arr && __arr[1] == "backend" && !req.session.isLogin) {
    console.log('It does not sign in...');
    return res.redirect("/login.html");
  }
  next();
});
// path.join(__dirname, 'uploads/')
app.use("/ueditor/ue", ueditor('uploads/', function(req, res, next) {

  let __default = req.session.email;
  if (!__default) {
     __default = "default";
  }

  // ueditor 客户发起上传图片请求
  if(req.query.action === 'uploadimage'){

    // 这里你可以获得上传图片的信息
    var foo = req.ueditor;
    console.log(foo.filename); // exp.png
    console.log(foo.encoding); // 7bit
    console.log(foo.mimetype); // image/png

    // 下面填写你要把图片保存到的路径 （ 以 path.join(__dirname, 'uploads') 作为根路径）
    var img_url = __default;
    res.ue_up(img_url); //你只要输入要保存的地址 。保存操作交给ueditor来做
  }
  //  客户端发起图片列表请求
  else if (req.query.action === 'listimage'){
    var dir_url = __default; // 要展示给客户端的文件夹路径
    console.log('list url: ', dir_url);
    res.ue_list(dir_url) // 客户端会列出 dir_url 目录下的所有图片
  }
  // 客户端发起其它请求
  else {
    res.setHeader('Content-Type', 'application/json');
    // 这里填写 ueditor.config.json 这个文件的路径
    res.redirect('/ueditor/ueditor.config.json')
}}));


/**
 * router mappings
 */
app.use('/', frontendRouter);
app.use('/', loginRouter)
app.use('/', logoutRouter)
app.use('/', registerRouter)
app.use('/backend', backendRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
