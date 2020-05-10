const { ParamStr, ParamDict, addGlobalParam } = Msa.require("params")

class AppParamDict extends ParamDict {
	constructor() {
		super()
		this.default_route = new ParamStr("/page/home")
	}
}

function addAppGlobalParams() {
	addGlobalParam("app", AppParamDict)
}

module.exports = { AppParamDict, addAppGlobalParams }
