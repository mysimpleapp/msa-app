const { addAppGlobalParams } = require("./params")
const MsaApp = require("./module")
module.exports = {
    startMsaModule: () => {
        addAppGlobalParams()
        return new MsaApp()
    },
    MsaApp
}
