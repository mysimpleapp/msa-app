var msaMain = module.exports = Msa.module("")

//var msaNavmenu = require("../../msa-navmenu/msa-server")
const msaUser = Msa.require("user")

const formatHtml = Msa.formatHtml

// params

Msa.params.default_route = "/page/home"

// template
const path = require('path'),
	join = path.join
const fs = require('fs')
const { promisify:prm } = require('util')
const mustache = require('mustache')
const template = fs.readFileSync(join(__dirname, 'views/index.html'), "utf8")
mustache.parse(template)

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
msaMain.app.use(Msa.bodyParser.urlencoded({ extended:false }))

const msaModsMdw = Msa.modulesRouter
msaMain.msaModsMdw = function(req, res, next) {
	res.sendPage = sendPage
	res._req = req
	msaModsMdw(req, res, next)
}
msaMain.app.use(msaMain.msaModsMdw)

// will be a method of "res"
const getUserHtml= msaUser.getHtml
const sendPage = function(htmlExpr) {
	try {
		const contentPartial = formatHtml(htmlExpr)
		// get user partial
		getUserHtml(this._req, this, userPartial => {
			_sendPage2({ contentPartial, userPartial }, this)
		})
	} catch(err) { this.sendStatus(500); console.warn(err) }
}
const _sendPage2 = function(partials, res) {
	try {
		// send content
		res.setHeader('content-type', 'text/html')
		const html = mustache.render(template, partials)
		res.send(html)
	} catch(err) { res.sendStatus(500); console.warn(err) }
}

// error handling
msaMain.handleErrMdw = function(err, req, res, next){
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
}
msaMain.app.use(msaMain.handleErrMdw)
