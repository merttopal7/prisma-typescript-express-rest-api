import fs from 'fs';
import path from 'path';
import { createPrismaSchemaBuilder } from '@mrleebo/prisma-ast';
const schemaContent = fs.readFileSync(path.join('prisma', 'schema.prisma'), 'utf-8');
const _builder = createPrismaSchemaBuilder(schemaContent);

const prismaToTS: Record<string, string> = {
    Int: 'number',
    BigInt: 'number',
    Float: 'number',
    Decimal: 'number',
    String: 'string',
    Boolean: 'boolean',
    DateTime: 'string',
    Json: 'any',
    Bytes: 'any'
};

const createValidationsForSchema = (schemaName: string) => {
    const product = _builder.findByType('model', { name: schemaName });
    const validation: any = {};
    product?.properties.forEach((property: any) => {
        const isId = (property.attributes ?? []).find((attr: any) => attr.name == "id");
        if (!isId && prismaToTS[property.fieldType]) validation[property.name] = {
            type: prismaToTS[property.fieldType],
            optional: property.optional
        }
    })
    return validation
}

const errorHandler = async <T>(prom: T) => {
    let errorMessage: string | undefined = ""
    let result; 
    let error = false;
    try {
        result = await prom;
    } catch (err: any) {
        error = true;
        console.log("[DatabaseError]:", err.message)
        errorMessage = err.message.split(`prisma`).join(``).split(`\n`).pop()
    }
    return {
        data: result || undefined,
        error,
        errorMessage: error ? errorMessage : undefined
    }
}

export const query = async <T>(queryPromise: T) => await errorHandler(queryPromise as T)

export const builder = <T>(model: any) => {
    return {
        validate(obj: any | boolean = false) {
            const schema = createValidationsForSchema(model.name);
            if (!obj || !schema) return;
            let object: any = {}
            Object.keys(schema).forEach(a => {
                if (typeof obj[a] != schema[a].type) {
                    if (!(schema[a].optional && typeof obj[a] == "undefined")) throw new Error(`[ValidationError] ${typeof obj[a]} type is not valid for [${a}][${schema[a].type}] !`)
                    } else
                object[a] = obj[a]
            })
            return object
        },
        prisma: model as T,
        query
    }
}
