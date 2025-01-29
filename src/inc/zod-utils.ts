import {z} from "zod";

function convertPropertyToZod(propSchema: any, isRequired: boolean = true): z.ZodType {
    let schema: z.ZodType;

    switch (propSchema.type) {
        case 'string':
            let stringSchema = z.string();
            if (propSchema.pattern) stringSchema = stringSchema.regex(new RegExp(propSchema.pattern));
            if (propSchema.minLength) stringSchema = stringSchema.min(propSchema.minLength);
            if (propSchema.maxLength) stringSchema = stringSchema.max(propSchema.maxLength);
            schema = stringSchema;
            break;

        case 'number':
        case 'integer':
            let numberSchema = propSchema.type === 'integer' ? z.number().int() : z.number();
            if (propSchema.minimum !== undefined) numberSchema = numberSchema.min(propSchema.minimum);
            if (propSchema.maximum !== undefined) numberSchema = numberSchema.max(propSchema.maximum);
            schema = numberSchema;
            break;

        case 'boolean':
            schema = z.boolean();
            break;

        case 'array':
            const itemSchema = propSchema.items ? convertPropertyToZod(propSchema.items) : z.any();
            schema = z.array(itemSchema);
            break;

        case 'object':
            schema = z.object(jsonPropsToZodShape(propSchema.properties, propSchema.required || []));
            break;

        default:
            schema = z.any();
    }

    return isRequired ? schema : schema.optional();
}

function jsonPropsToZodShape(properties: Record<string, any>, required: string[] = []): z.ZodRawShape {
    const shape: z.ZodRawShape = {};

    for (const [key, propSchema] of Object.entries(properties)) {
        const isRequired = required.includes(key);
        shape[key] = convertPropertyToZod(propSchema, isRequired);
    }

    return shape;
}

function convertJsonSchemaToZodShape(schema: any): z.ZodRawShape {
    if (schema.type !== 'object' || !schema.properties) {
        throw new Error('Schema must be an object type with properties');
    }

    return jsonPropsToZodShape(schema.properties, schema.required || []);
}

export {convertJsonSchemaToZodShape};
