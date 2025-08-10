import fs from 'fs';
import path from 'path';
import { createPrismaSchemaBuilder } from '@mrleebo/prisma-ast';
import prisma from '../loaders/prisma.loader';
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
            ...property,
            type: prismaToTS[property.fieldType],
            optional: property.optional
        }
    })
    return validation
}
const getAvailableModels = (): string[] => {
    return Object.keys(prisma).filter(key =>
        !key.startsWith('_') &&
        !key.startsWith('$') &&
        typeof (prisma as any)[key].findMany === 'function'
    );
};

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


export const buildValidation = (model: any) => {
    return {
        validate: (obj: any | boolean = false) => {
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
        }
    }
}

export const builder = <T>(model: any) => {
    return {
        validate: buildValidation(model).validate,
        prisma: model as T,
        query
    }
}
const exampleRoleBasedRule = {
    roleId: 1,
    model: "product",
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false
};
const dynamicRouteResponses = {
    "security": [
        {
            "bearerAuth": []
        }
    ],
    "responses": {
        "200": {
            "description": "Successful"
        },
        "401": {
            "description": "Token Not Found!"
        },
        "403": {
            "description": "Forbidden!"
        },
        "400": {
            "description": "Invalid input"
        },
        "500": {
            "description": "Error"
        }
    }
}
export const swaggerDynamicRoutes: any = {}
export const generateSwaggerSchema = () => {
    const availableModels = getAvailableModels().map((model: string) => [model.charAt(0).toUpperCase() + model.slice(1), model]);
    generateModelPermissions(availableModels);
    availableModels.forEach(([modelCapitalize, model]: any) => {
        const validations = createValidationsForSchema(modelCapitalize);
        const requiredAttributes = Object.entries(validations).filter(([modelName, obj]: any) => !obj?.optional).map((obj: any) => obj[0]);
        const properties: any = {};
        Object.entries(validations).forEach((obj: any) => {
            const props: any = { type: obj[1].type };
            const isThereDefaultValue = (obj[1].attributes ?? []).find((attr: any) => attr.name === "default");
            if (isThereDefaultValue) {
                const findArgument = (isThereDefaultValue.args ?? []).find((arg: any) => arg.type === 'attributeArgument');
                if (findArgument) props.example = findArgument.value;
            }
            properties[obj[0]] = props;
        });
        const dynamicRoute: any = {}
        dynamicRoute.post = {
            "summary": `Create new ${modelCapitalize}`,
            "tags": ["Items"],
            "requestBody": {
                "required": true,
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "required": requiredAttributes,
                            "properties": properties
                        }
                    }
                }
            },
            ...dynamicRouteResponses
        }
        swaggerDynamicRoutes[`/items/${model}`] = dynamicRoute;
    })
    return swaggerDynamicRoutes
}

export const generateModelPermissions = async (models: any) => {
    const roles = await query(prisma.role.findMany());
    if (!roles.error) {
        for (let i = 0; i < (models ?? [])?.length; i++) {
            exampleRoleBasedRule.model = models[i][1];
            for (let y = 0; y < (roles.data ?? [])?.length; y++) {
                exampleRoleBasedRule.roleId = (roles.data ?? [])[y].id;
                const isAdmin: boolean = exampleRoleBasedRule.roleId == 1;
                exampleRoleBasedRule.canCreate = isAdmin;
                exampleRoleBasedRule.canRead = isAdmin;
                exampleRoleBasedRule.canDelete = isAdmin;
                exampleRoleBasedRule.canUpdate = isAdmin;
                const response = await query(prisma.rolePermission.upsert({
                    where: {
                        roleId_model: {
                            roleId: exampleRoleBasedRule.roleId,
                            model: exampleRoleBasedRule.model
                        }
                    },
                    update: {},
                    create: exampleRoleBasedRule
                }));
                console.log("Add to Static Object",response)
            }
        }
    }
}