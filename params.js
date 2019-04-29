const { ParamStrDef, ParamsDef, addGlobalParam } = Msa.require("params")

const appParamsDef = new ParamsDef()
appParamsDef.add("default_route", new ParamStrDef({
	defVal: "/page/home"
}))

addGlobalParam("app", appParamsDef)

module.exports = { appParamsDef }
