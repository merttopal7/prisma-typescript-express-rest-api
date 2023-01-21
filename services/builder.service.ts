const errorHandler = async (query:object|boolean=false,main:Function) => {
    let errorMessage :string|undefined = ""
    const result = await main(query).catch((err:Error) => {
        console.log("[DatabaseError]:",err.message)
        errorMessage=err.message.split(`prisma`).join(``).split(`\n`).join(` `)
        return false
    })
    return {
        data: result || undefined,
        error: !result,
        errorMessage: !result ? errorMessage : undefined
    }
}

const builder = (model:any,schema:any|boolean=false) => {
    return {
        validate(obj:any|boolean=false) {
            if(!obj || !schema) return
            let object :any = {}
            Object.keys(schema).forEach(a => {
                if(typeof obj[a] != schema[a]) throw new Error(`[ValidationError] Type is not valid for [${a}][${schema[a]}] !`)
                object[a] = obj[a]
            })
            return object
        },
        async find(query:object|boolean=false) {
            if(!query) return
            return await errorHandler(query,model.findUnique)
        },
        async findMany(query:object|boolean=false) {
            if(!query) return errorHandler(false,model.findMany)
            return await errorHandler(query,model.findMany)
        },
        async create(query:object|boolean=false) {
            if(!query) return
            return await errorHandler(query,model.create)
        },
        async createMany(query:object|boolean=false) {
            if(!query) return
            return await errorHandler(query,model.createMany)
        },
        async update(query:object|boolean=false) {
            if(!query) return
            return await errorHandler(query,model.update)
        },
        async updateMany(query:object|boolean=false) {
            if(!query) return
            return await errorHandler(query,model.updateMany)
        },
        async delete(query:object|boolean=false) {
            if(!query) return
            return await errorHandler(query,model.delete)
        },
        async deleteMany(query:object|boolean=false) {
            if(!query) return
            return await errorHandler(query,model.deleteMany)
        }
    }
}
export default builder