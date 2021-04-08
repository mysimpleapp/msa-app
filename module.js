const { formatHtml } = Msa.require('utils')
const { globalParams } = Msa.require('params')

const MsaApp = class extends Msa.Module {

	constructor() {
		super()
		this.init()
	}

	async init() {
		await this.initTemplate()
		this.initApp()
	}

	getTemplateSrc() {
		return join(__dirname, 'templates/index.html')
	}

	async initTemplate() {
		this.template = await readFile(this.getTemplateSrc(), "utf8")
		mustache.parse(this.template)
	}

	renderTemplate(kwargs) {
		return mustache.render(this.template, kwargs)
	}

	initApp() {
		if (this.initFirstMdws) this.initFirstMdws()
		if (this.initDebugMdw) this.initDebugMdw()
		if (this.initDefaultRouteMdw) this.initDefaultRouteMdw()
		if (this.initMsaModsMdw) this.initMsaModsMdw()
		if (this.initEndMdws) this.initEndMdws()
		if (this.initStaticMdw) this.initStaticMdw()
		if (this.initErrMdw) this.initErrMdw()
	}

	// first middlewares
	initFirstMdws() {
		this.app
			.use(Msa.express.json())
			.use(Msa.express.urlencoded({ extended: false }))
			.use((req, res, next) => {
				res.sendPage = this.sendPage
				res._req = req
				res._msaApp = this
				next()
			})
	}

	// debug log
	initDebugMdw() {
		if (Msa.params.log_level === "DEBUG") {
			this.app.use((req, res, next) => {
				let msg = [`[${process.pid}]`, req.method, req.url]
				if (req.body && !isEmptyObj(req.body)) msg.push(req.body)
				console.log(...msg)
				next()
			})
		}
	}

	// default route
	initDefaultRouteMdw() {
		const defRoute = globalParams.app.default_route.get()
		if (defRoute) {
			this.app.get("/", (req, res, next) => {
				res.redirect(defRoute)
			})
		}
	}

	// msa modules
	initMsaModsMdw() {
		this.app.use("/msa", Msa.modulesRouter)
	}

	// static
	initStaticMdw() {
		this.app.use(Msa.express.static(join(__dirname, "static")))
	}

	// error handling
	initErrMdw() {
		this.app.use((err, req, res, next) => {
			var text, code
			// determine error code & text
			if (typeof err == 'object') {
				if (err instanceof Error) text = err
				else code = err.code, text = err.text
			} else if (typeof err == 'number') code = err
			else text = err
			if (!code) code = 500
			// respond to client
			if (!text || code >= 500) res.sendStatus(code)
			else res.status(code).send(text)
			// log error
			if (Msa.params.log_level === "DEBUG")
				console.error('ERROR', code, text || '')
		})
	}
}
const MsaAppPt = MsaApp.prototype

// sendPage
// (will be a method of "res")
const { getHtml: getUserHtml } = Msa.require("user")
const { getHtml: getHeaderHtml } = Msa.require("header")
MsaAppPt.sendPage = async function (htmlExpr) {
	const res = this
	try {
		const contentPartial = formatHtml(htmlExpr)
		const userPartial = formatHtml(await getUserHtml(this._req))
		const headerPartial = formatHtml(await getHeaderHtml(this._req))
		// send content
		res.setHeader('content-type', 'text/html')
		const html = res._msaApp.renderTemplate({
			contentPartial,
			userPartial,
			headerPartial
		})
		res.send(html)
	} catch (err) { this.sendStatus(500); console.warn(err) }
}

/*
MsaAppPt.sendPage = function (htmlExpr) {
	try {
		const contentPartial = formatHtml(htmlExpr)
		// get user partial
		getUserHtml(this._req, this, userPartial => {
			_sendPage2({ contentPartial, userPartial }, this)
		})
	} catch (err) { this.sendStatus(500); console.warn(err) }
}
const _sendPage2 = function (partials, res) {
	try {
		// send content
		res.setHeader('content-type', 'text/html')
		const html = res._msaApp.renderTemplate(partials)
		res.send(html)
	} catch (err) { res.sendStatus(500); console.warn(err) }
}
*/

// utils
const path = require('path'),
	join = path.join
const fs = require('fs')
const { promisify: prm } = require('util')
const mustache = require('mustache')
const readFile = prm(fs.readFile)

function isEmptyObj(o) {
	return (typeof o === "object") && (Object.keys(o).length === 0)
}

module.exports = MsaApp
