//const msaNavmenu = require("../../msa-navmenu/msa-server")
const msaUser = Msa.require("user")
const { ParamStr } = Msa.require("params")

// params
new ParamStr("app.default_route", {
	defVal: "/page/home"
})

// template
const path = require('path'),
	join = path.join
const fs = require('fs')
const { promisify:prm } = require('util')
const mustache = require('mustache')
const template = fs.readFileSync(join(__dirname, 'templates/index.html'), "utf8")
mustache.parse(template)

const MsaApp = class extends Msa.Module {
	constructor() {
		super()
		this.initApp()
	}

	initApp() {
		if(this.initDebugMdw) this.initDebugMdw()
		if(this.initFirstMdws) this.initFirstMdws()
		if(this.initDefaultRouteMdw) this.initDefaultRouteMdw()
		if(this.initMsaModsMdw) this.initMsaModsMdw()
		if(this.initEndMdws) this.initEndMdws()
		if(this.initStaticMdw) this.initStaticMdw()
		if(this.initErrMdw) this.initErrMdw()
	}

	// debug log
	initDebugMdw(){
		if(Msa.params.log_level==="DEBUG") {
			this.app.use((req, res, next) => {
				console.log(`[${process.pid}] ${req.method} ${req.url}`)
				next()
			})
		}
	}

	// first middlewares
	initFirstMdws() {
		this.app
			.use(Msa.bodyParser.text())
			.use(Msa.bodyParser.json())
			.use(Msa.bodyParser.urlencoded({ extended:false }))
			.use((req, res, next) => {
				res.sendPage = this.sendPage
				res._req = req
				next()
			})
	}

	// default route
	initDefaultRouteMdw() {
		const defRoute = Msa.params.app.default_route
		if(defRoute) {
			this.app.get("/", (req, res, next) => {
				res.redirect(defRoute)
			})
		}
	}

	// msa modules
	initMsaModsMdw() {
		this.app.use(Msa.modulesRouter)
	}

	// static
	initStaticMdw() {
		this.app.use(Msa.express.static(join(__dirname, "static")))
	}

	// error handling
	initErrMdw(){
		this.app.use((err, req, res, next) => {
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
	}
}
const MsaAppPt = MsaApp.prototype

// sendPage
// (will be a method of "res")
const formatHtml = Msa.formatHtml
const getUserHtml= msaUser.getHtml
MsaAppPt.sendPage = function(htmlExpr) {
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

module.exports = new MsaApp()
