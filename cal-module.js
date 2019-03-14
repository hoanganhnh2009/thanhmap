class Service {
    constructor(name) {
        this._name = name
    }
    helloWorld() {
        return this._name
    }
}

// export default Service

module.exports = Service