import express, { Request, Response, Router } from 'express';
import { ParsedQs } from 'qs';
import { Prisma } from '../models/base.models'
import { RoleManager } from '../services/role.service';
import { relationToTable } from '../services/builder.service';
import { transform } from '../controller/payload.controller';
const { prisma, query, buildValidation } = Prisma;

type FilterQuery = ParsedQs | { [key: string]: any };


interface FilterOperators {
    _eq?: any;
    _neq?: any;
    _gt?: number | string;
    _gte?: number | string;
    _lt?: number | string;
    _lte?: number | string;
    _in?: any[];
    _nin?: any[];
    _contains?: string;
    _startsWith?: string;
    _endsWith?: string;
    _null?: boolean;
}

interface LogicalOperators {
    and?: FilterCondition | FilterCondition[];
    or?: FilterCondition | FilterCondition[];
    not?: FilterCondition;
}

interface FieldFilter extends FilterOperators {
    [key: string]: any;
}

interface FilterCondition extends LogicalOperators {
    [fieldName: string]: FieldFilter | FilterCondition | FilterCondition[] | any;
}

interface QueryParams {
    page?: string;
    limit?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    [key: string]: any;
}

interface PostRequestBody {
    filter?: FilterCondition;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

interface ApiResponse<T = any> {
    data: T[];
    pagination: PaginationInfo;
    filter?: any;
}

interface ErrorResponse {
    error: string;
    message?: string;
}

type PrismaWhereInput = {
    AND?: PrismaWhereInput[];
    OR?: PrismaWhereInput[];
    NOT?: PrismaWhereInput;
    [key: string]: any;
};


type ModelName = keyof typeof prisma;

function getDelegate<T extends ModelName>(model: T): (typeof prisma)[T] {
    return prisma[model];
}

const parseSelectParam = async (selectParam?: string, model?: string, userId?: number): Promise<any> => {
    if (!selectParam) return undefined;
    const result: any = {};
    const fields: any = selectParam.split(',').map(f => f.trim()).filter(Boolean);

    for (const field of fields) {
        let parts = field.replaceAll(`${model}.`, ``).split('.');
        if (model && parts[0] === model) {
            parts.shift();
        }

        let current = result;
        let lastModelText: string = model as string;
        let lastModel: any = {};
        for (let idx = 0; idx < parts.length; idx++) {
            const part = parts[idx];
            if (relationToTable[lastModelText]) lastModel = relationToTable[lastModelText][part] ?? lastModel;
            if (lastModel.fieldType) lastModelText = lastModel.fieldType[0]?.toLowerCase() + lastModel.fieldType?.substring(1);
            const role = await RoleManager.can(userId as number, lastModelText);
            if (!role.canRead) return { error: true, errorMessage: `Yo`, table: role.model };
            if (idx === parts.length - 1) {
                current[part] = true;
            } else {
                if (!current[part]) {
                    current[part] = { select: {} };
                } else if (current[part] === true)
                    current[part] = { select: {} };
                current = current[part].select;
            }
        }
    }

    return { error: false, result };
};



const parseIncludeParam = (includeParam?: string): object | undefined => {
    if (!includeParam) return undefined;

    const result: any = {};
    const includes = includeParam.split(',').map(s => s.trim()).filter(Boolean);

    includes.forEach(item => {
        const [relation, fields] = item.split('.'); // posts.id gibi
        if (!fields || fields === '*') {
            // Tüm alanlar dahil
            result[relation] = true;
        } else {
            // Belirli alanları seç
            const selectFields = fields.split('|').reduce((acc, f) => {
                acc[f] = true;
                return acc;
            }, {} as Record<string, boolean>);

            result[relation] = { select: selectFields };
        }
    });

    return Object.keys(result).length > 0 ? result : undefined;
};



const convertOperatorToPrisma = (operator: keyof FilterOperators, value: any): any => {
    switch (operator) {
        case '_eq':
            return value;
        case '_neq':
            return { not: value };
        case '_gt':
            return { gt: parseNumber(value) };
        case '_gte':
            return { gte: parseNumber(value) };
        case '_lt':
            return { lt: parseNumber(value) };
        case '_lte':
            return { lte: parseNumber(value) };
        case '_in':
            return { in: Array.isArray(value) ? value : value.split(',') };
        case '_nin':
            return { notIn: Array.isArray(value) ? value : value.split(',') };
        case '_contains':
            return { contains: value };
        case '_startsWith':
            return { startsWith: value };
        case '_endsWith':
            return { endsWith: value };
        case '_null':
            return value === true ? null : { not: null };
        default:
            throw new Error(`Not found ${operator} operator!`);
    }
};

const parseNumber = (value: any): number | any => {
    const num = Number(value);
    return isNaN(num) ? value : num;
};

const parseBoolean = (value: any): boolean | any => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
};

const buildPrismaWhere = (filterObj: FilterCondition): PrismaWhereInput => {
    const where: PrismaWhereInput = {};

    const processFilter = (obj: FilterCondition, target: PrismaWhereInput): void => {
        for (const [key, value] of Object.entries(obj)) {
            if (key === 'and') {
                // Handle nested AND conditions
                if (Array.isArray(value)) {
                    // Array of conditions: [{name: {_eq: "test"}}, {age: {_gt: 18}}]
                    target.AND = value.map((condition: FilterCondition) => buildPrismaWhere(condition));
                } else if (typeof value === 'object' && value !== null) {
                    // Object with multiple conditions that should all be true
                    const andConditions: PrismaWhereInput[] = [];
                    for (const [andKey, andValue] of Object.entries(value)) {
                        if (andKey === 'and' || andKey === 'or' || andKey === 'not') {
                            // Nested logical operators
                            const nestedCondition: FilterCondition = {};
                            (nestedCondition as any)[andKey] = andValue;
                            andConditions.push(buildPrismaWhere(nestedCondition));
                        } else {
                            // Regular field conditions
                            const fieldCondition: FilterCondition = {};
                            (fieldCondition as any)[andKey] = andValue;
                            andConditions.push(buildPrismaWhere(fieldCondition));
                        }
                    }
                    target.AND = andConditions;
                }
            } else if (key === 'or') {
                // Handle nested OR conditions
                if (Array.isArray(value)) {
                    // Array of conditions: [{name: {_eq: "john"}}, {name: {_eq: "jane"}}]
                    target.OR = value.map((condition: FilterCondition) => buildPrismaWhere(condition));
                } else if (typeof value === 'object' && value !== null) {
                    // Object with multiple conditions where any can be true
                    const orConditions: PrismaWhereInput[] = [];
                    for (const [orKey, orValue] of Object.entries(value)) {
                        if (orKey === 'and' || orKey === 'or' || orKey === 'not') {
                            // Nested logical operators
                            const nestedCondition: FilterCondition = {};
                            (nestedCondition as any)[orKey] = orValue;
                            orConditions.push(buildPrismaWhere(nestedCondition));
                        } else {
                            // Regular field conditions
                            const fieldCondition: FilterCondition = {};
                            (fieldCondition as any)[orKey] = orValue;
                            orConditions.push(buildPrismaWhere(fieldCondition));
                        }
                    }
                    target.OR = orConditions;
                }
            } else if (key === 'not') {
                target.NOT = buildPrismaWhere(value as FilterCondition);
            } else if (typeof value === 'object' && value !== null) {
                // Check if this is a field with operators
                const operators = Object.keys(value).filter(k => k.startsWith('_'));
                const logicalOps = Object.keys(value).filter(k => ['and', 'or', 'not'].includes(k));

                if (operators.length > 0) {
                    // This is a field with operators
                    const fieldOperators = Object.entries(value)
                        .filter(([operator]) => operator.startsWith('_'));

                    if (fieldOperators.length === 1 && fieldOperators[0][0] === '_eq') {
                        // _eq varsa direkt değeri ata
                        target[key] = parseBoolean(fieldOperators[0][1]);
                    } else {
                        const fieldConditions: any = {};
                        for (const [operator, operatorValue] of fieldOperators) {
                            const prismaCondition = convertOperatorToPrisma(operator as keyof FilterOperators, parseBoolean(operatorValue));
                            if (typeof prismaCondition === 'object' && !Array.isArray(prismaCondition)) {
                                Object.assign(fieldConditions, prismaCondition);
                            }
                        }
                        target[key] = fieldConditions;
                    }
                } else if (logicalOps.length > 0) {
                    // This field has nested logical operators
                    target[key] = {};
                    processFilter(value as FilterCondition, target[key] as PrismaWhereInput);
                } else {
                    // This is nested object, recurse
                    target[key] = {};
                    processFilter(value as FilterCondition, target[key] as PrismaWhereInput);
                }
            } else {
                // Direct field assignment
                target[key] = parseBoolean(value);
            }
        }
    };

    processFilter(filterObj, where);
    return where;
};

const parseNestedQuery = (query: QueryParams): FilterCondition => {
    const result: FilterCondition = {};

    for (const [key, value] of Object.entries(query)) {
        if (key.startsWith('filter[')) {
            // Remove 'filter[' prefix and trailing ']'
            const cleanKey = key.replace(/^filter\[/, '').replace(/\]$/g, '');
            const segments = cleanKey.split('][');

            let current: any = result;

            for (let i = 0; i < segments.length - 1; i++) {
                const segment = segments[i];
                if (!current[segment]) {
                    current[segment] = {};
                }
                current = current[segment];
            }

            // Son segment operator ise string olarak ekle
            const lastSegment = segments[segments.length - 1];
            if (!current[lastSegment]) {
                current[lastSegment] = value;
            } else if (Array.isArray(current[lastSegment])) {
                current[lastSegment].push(value);
            } else {
                current[lastSegment] = [current[lastSegment], value];
            }
        }
    }

    return result;
};

const getAvailableModels = (): string[] => {
    return Object.keys(prisma).filter(key =>
        !key.startsWith('_') &&
        !key.startsWith('$') &&
        typeof (prisma as any)[key].findMany === 'function'
    );
};

export const findById = (req: Request, res: Response) =>
    req.handle(async () => {
        const model = req.params.model;
        const id = req.params.id;
        const userId = req.user?.userId ?? 0;
        const role = await RoleManager.can(userId, model);
        if (role && !role?.canRead) return res.status(403).json({
            error: true,
            errorMessage: `[${model}][read] You do not have access permission.`,
        });

        const availableModels = getAvailableModels();
        if (!availableModels.includes(model)) {
            return res.status(400).json({
                error: true,
                errorMessage: `Model '${model}' not found.`,
                availableModels
            });
        }

        const parsedSelect = await parseSelectParam(req.query?.select as string, model as string, userId);
        if (parsedSelect?.error) return res.status(403).json({
            error: true,
            errorMessage: `[${parsedSelect.table}][read] You do not have access permission.`,
        });
        const _parsedSelect = parsedSelect.result;
        const delegate = (prisma as any)[model];

        const data = await query(delegate.findUnique({
            where: {
                id: isNaN(Number(id)) ? id : Number(id)
            },
            ...(_parsedSelect ? { select: _parsedSelect } : {})
        }));

        if (!data.data)
            return res.status(404).json(data);

        return res.json(data);
    })

export const find = (req: Request, res: Response) =>
    req.handle(async () => {
        const { model } = req.params;
        const userId = req.user?.userId ?? 0;
        const role = await RoleManager.can(userId, model);
        if (role && !role?.canRead) return res.status(403).json({
            error: true,
            errorMessage: `[${model}][read] You do not have access permission.`,
        });
        const method = req.method;
        const filterQuery: FilterQuery = method === 'GET' ? (req.query as ParsedQs) : (req.body as { [key: string]: any });
        const { page = '1', limit = '10', sort, order = 'asc', filter, select, include } = filterQuery;

        const parsedSelect = await parseSelectParam(select as string, model as string, userId);
        if (parsedSelect?.error) return res.status(403).json({
            error: true,
            errorMessage: `[${parsedSelect.table}][read] You do not have access permission.`,
        });
        const _parsedSelect = parsedSelect.result;
        const availableModels = getAvailableModels();
        if (!availableModels.includes(model)) {
            return res.status(400).json({
                error: true,
                errorMessage: `Model '${model}' not found.`,
                availableModels
            });
        }

        const rawFilter = typeof filter === 'string' ? parseNestedQuery(filterQuery) : filter;

        const parsedFilter: FilterCondition =
            rawFilter && typeof rawFilter === 'object' && !Array.isArray(rawFilter)
                ? (rawFilter as FilterCondition)
                : {};

        const where: PrismaWhereInput = Object.keys(parsedFilter).length > 0 ? buildPrismaWhere(parsedFilter) : {};
        const orderBy: any = typeof sort === 'string' ? { [sort]: String(order).toLowerCase() } : undefined;
        const skip: number = (parseInt(page.toString()) - 1) * parseInt(limit.toString());
        const take: number = parseInt(limit.toString());

        const [data, total] = await Promise.all([
            query((prisma as any)[model].findMany({
                where,
                orderBy,
                skip,
                take,
                ...(_parsedSelect ? { select: _parsedSelect } : {})
            })),
            query((prisma as any)[model].count({ where }))
        ]);

        const response: ApiResponse = {
            data: data.data,
            pagination: {
                page: parseInt(page.toString()),
                limit: parseInt(limit.toString()),
                total: total.data,
                pages: Math.ceil(total.data / parseInt(limit.toString()))
            }
        };

        return res.json({ ...response, ...data });
    })

export const models = (req: Request, res: Response) =>
    req.handle(async () => {
        const availableModels = getAvailableModels();
        return res.json({
            error: false,
            models: availableModels,
            count: availableModels.length
        });
    });

export const post = (req: Request, res: Response) =>
    req.handle(async () => {
        const { model } = req.params;
        const userId = req.user?.userId ?? 0;
        const role = await RoleManager.can(userId, model);
        if (role && !role?.canCreate) return res.status(403).json({
            error: true,
            errorMessage: `[${model}][create] You do not have access permission.`,
        });
        const availableModels = getAvailableModels();
        if (!availableModels.includes(model)) {
            return res.status(400).json({
                error: true,
                errorMessage: `Model '${model}' not found.`,
                availableModels
            });
        }
        if (transform[model] && transform[model].body) {
            const customBody = await transform[model].body(req.body);
            if (customBody) req.body = customBody;
        }
        const delegate = getDelegate(model as ModelName) as any;
        const build = buildValidation(delegate);
        const validatedData = build.validate(req.body);
        const postResult = await query(delegate.create({
            data: validatedData
        }))
        return res.status(postResult.error ? 500 : 200).json({
            ...postResult
        })
    })


export const put = (req: Request, res: Response) =>
    req.handle(async () => {
        const { model } = req.params;
        const id = req.params.id;
        const userId = req.user?.userId ?? 0;
        const role = await RoleManager.can(userId, model);
        if (role && !role?.canUpdate) return res.status(403).json({
            error: true,
            errorMessage: `[${model}][update] You do not have access permission.`,
        });
        const availableModels = getAvailableModels();
        if (!availableModels.includes(model)) {
            return res.status(400).json({
                error: true,
                errorMessage: `Model '${model}' not found.`,
                availableModels
            });
        }
        const delegate = getDelegate(model as ModelName) as any;
        const existData = await query(delegate.findUnique({ where: { id: +id } }))
        if (existData.error) return res.status(400).json(existData);
        if (!existData.data) return res.status(404).json({ error: true, errorMessage: `Not found ${model}!` });
        const build = buildValidation(delegate);
        const validatedData = build.validate({ ...existData.data, ...req.body });

        const putResult = await query(delegate.update({
            data: validatedData,
            where: { id: +id }
        }))
        return res.status(putResult.error ? 500 : 200).json({
            ...putResult
        })
    })


export const createData = (req: Request, res: Response) =>
    req.handle(async () => {
        // 1. Epin kategorisini oluştur
        const epinCategory = await prisma.category.upsert({
            where: { slug: 'epin' },
            update: {},
            create: {
                name: 'Epin',
                slug: 'epin',
            },
        });

        // 2. Valorant kategorisini oluştur, parent olarak Epin'i ata
        const valorantCategory = await prisma.category.upsert({
            where: { slug: 'valorant' },
            update: {},
            create: {
                name: 'Valorant',
                slug: 'valorant',
                parentId: epinCategory.id,
            },
        });

        // Ürün isimleri ve fiyatları (örnek fiyatlar verdim, sen değiştirebilirsin)
        const productsData = [
            { name: '100VP', price: 1 },
            { name: '200VP', price: 2 },
            { name: '500VP', price: 5 },
            { name: '1000VP', price: 10 },
        ];

        // Örnek ownerId (varsa kendi kullanıcı ID'n ile değiştir)
        const ownerId = 1; // Burayı gerçek user id ile değiştir

        // Ürünleri oluştur ve her iki kategoriye bağla
        for (const prod of productsData) {
            // 3. Ürünü oluştur
            const product = await prisma.product.create({
                data: {
                    name: prod.name,
                    price: prod.price,
                    ownerId: ownerId,
                    stock: 100, // örnek stok
                    categories: {
                        connect: [{ id: epinCategory.id }, { id: valorantCategory.id }],
                    },
                },
            });
            console.log(`Ürün oluşturuldu: ${product.name}`);
        }
        return res.json({
            ok: 1
        })
    })
// Usage examples with TypeScript:
/*
Basic examples:
GET /find/user?filter[and][name][_eq]=john&filter[and][age][_gt]=18
GET /find/user?filter[or][email][_contains]=@gmail.com&filter[or][email][_contains]=@yahoo.com

Nested AND/OR examples:
GET /find/user?filter[and][or][name][_eq]=john&filter[and][or][email][_contains]=john@&filter[and][age][_gt]=18
// This creates: AND ( OR (name = "john" OR email contains "john@") AND age > 18 )

GET /find/user?filter[or][and][name][_eq]=john&filter[or][and][age][_gt]=18&filter[or][email][_contains]=admin
// This creates: OR ( AND (name = "john" AND age > 18) OR email contains "admin" )

Complex nested example:
GET /find/user?filter[and][or][name][_eq]=john&filter[and][or][name][_eq]=jane&filter[and][age][_gt]=18&filter[and][status][_eq]=active
// This creates: AND ( OR (name = "john" OR name = "jane") AND age > 18 AND status = "active" )

POST /find/user with complex nested structure:
{
  "filter": {
    "and": {
      "or": {
        "name": { "_eq": "john" },
        "email": { "_contains": "john@" }
      },
      "age": { "_gt": 18 },
      "status": { "_eq": "active" },
      "posts": {
        "some": {
          "and": {
            "title": { "_contains": "javascript" },
            "published": { "_eq": true }
          }
        }
      }
    }
  },
  "page": 1,
  "limit": 10,
  "sort": "createdAt",
  "order": "desc"
}

Multiple nested levels:
POST /find/user
{
  "filter": {
    "or": [
      {
        "and": {
          "name": { "_eq": "john" },
          "age": { "_gt": 25 }
        }
      },
      {
        "and": {
          "email": { "_contains": "admin" },
          "role": { "_eq": "admin" }
        }
      },
      {
        "posts": {
          "some": {
            "or": {
              "title": { "_contains": "urgent" },
              "priority": { "_eq": "high" }
            }
          }
        }
      }
    ]
  }
}
*/