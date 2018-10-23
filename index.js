var msaMain = module.exports = Msa.module("")

//var msaNavmenu = require("../../msa-navmenu/msa-server")
var msaUser = Msa.require("user")

var formatHtml = Msa.formatHtml

// params

Msa.params.default_route = "/page/home"

// template
var path = require('path'),
	join = path.join
var fs = require('fs')
var mustache = require('mustache')
var template = fs.readFileSync(join(__dirname, 'views/index.html'), "utf8")
mustache.parse(template)

// default route
msaMain.defaultRoute = Msa.params.default_route
/*msaMain.setDefaultRoute = function(next) {
	msaUser.isFirstRegisterDone(function(err, done) {
		if(err) return next(err)
		if(done) msaMain.defaultRoute = Msa.params.default_route
		else {
			msaMain.defaultRoute = "/user/firstregister"
			msaUser.onFirstRegister = function(next) {
				msaMain.setDefaultRoute(next)
			}
		}
		next && next()
	})
}
msaMain.setDefaultRoute(function(err) {
	if(err) console.log(err)
})*/

// log
if(Msa.params.log_level==="DEBUG") {
	msaMain.app.use(function(req, res, next) {
		console.log(req.method+' '+req.url)
		next()
	})
}

// default route
msaMain.app.get("/", function(req, res, next) {
	res.redirect(Msa.params.default_route)
})

// import some middlewares
msaMain.app.use(Msa.bodyParser.text())
msaMain.app.use(Msa.bodyParser.json())
msaMain.app.use(Msa.bodyParser.urlencoded({extended:false}))
// msaMain.app.use(Msa.preRouter)

// partialApp
//var partialApp = Msa.subApp()
//msaMain.app.use("/partial", partialApp)

// msaMain app routing
msaMain.app.use(Msa.modulesRouter)
//partialApp.use(Msa.subAppsRouter)

var getPartialPrm = msaMain.getPartialPrm = function(getPartial, req, res){
  return new Promise((resolve, reject) => {
    getPartial(req, res, () => {
      if(res.partial === undefined) resolve(null)
      var partial = formatHtml(res.partial)
      delete res.partial
      resolve(partial)
    })
  })
}

// render view with partial content
msaMain.get = async function(req, res, next) {
  try {
    var contentPartial = res.partial
    if(contentPartial === undefined) return next()
//    var headerPartial = await getPartialPrm(msaNavmenu.getPartial, req, res)
    var userPartial = await getPartialPrm(msaUser.getPartial, req, res)
    // send content
    res.setHeader('content-type', 'text/html')
    var html = mustache.render(template, {
//      headerPartial: headerPartial,
      userPartial: userPartial,
      contentPartial: contentPartial
    })
    res.send(html)
  } catch(err) {
    next(err)
  }
}
/*
	// check if a sub app have replied a partial
	if(res.partial===undefined) return next()
	var contentPartial = formatHtml(res.partial)
	delete res.partial
	// get partial from navmenu
	msaNavmenu.getPartial(req, res, function(){
		_mainGet2(contentPartial, req, res, next)
	})
}
var _mainGet2 = function(contentPartial, req, res, next) {
	if(res.partial===undefined) return next("No partial returned from navmenu component.")
	var headerPartial = formatHtml(res.partial)
	delete res.partial
	// get partial form user
	msaUser.getPartial(req, res, function(){
		_mainGet3(contentPartial, headerPartial, res, next)
	})
}
var _mainGet3 = function(contentPartial, headerPartial, res, next) {
	if(res.partial===undefined) return next("No partial returned from user component.")
	var userPartial = formatHtml(res.partial)
	delete res.partial
	// send content
	res.setHeader('content-type', 'text/html')
	var html = mustache.render(template, {
//		headerPartial: headerPartial,
//		userPartial: userPartial,
		contentPartial: contentPartial
	})
	res.send(html)
}
*/
msaMain.app.get('*', msaMain.get)

// render partial as ajax
/*
partialApp.get('*', function(req, res, next) {
	if(!res.partial) return next()
	res.json(res.partial)
})
*/
// static routing
//main.app.use(Msa.express.static(Msa.dirname))

// error handling
msaMain.app.use(function(err, req, res, next){
	// determine error code & text
	if(typeof err=='object') {
		if(err instanceof Error) var text=err
		else var code=err.code, text=err.text

	} else if(typeof err=='number') var code=err
	else var text=err
	if(!code) code=500
	if(!text) text=''
	// respond to client
	res.sendStatus(code)
	// log error
	if(Msa.params.log_level==="DEBUG") {
		console.error('ERROR', code, text)
	}
})
