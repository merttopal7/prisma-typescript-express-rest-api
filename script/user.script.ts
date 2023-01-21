class Script {
    static modules: Array<Object>=[]
    constructor() {

    }
    static add(module:any) {
        Script.modules.push(module)
    }
}

Script.add({
    "endpoint": "/user",
    "model": "Prisma"
})
console.log(Script.modules)