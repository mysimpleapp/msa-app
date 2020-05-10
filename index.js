require("./params")
const MsaApp = require("./module")
module.exports = {
    startMsaModule: () => new MsaApp(),
    MsaApp
}
