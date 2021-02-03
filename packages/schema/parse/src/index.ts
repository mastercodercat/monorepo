import { TypeInfo, createTypeInfo } from "./typeInfo";
import { extractors, SchemaExtractor } from "./extract";
import { TypeInfoTransforms, performTransforms } from "./transform";
import { finalizePropertyDef } from "./transform/finalizePropertyDef";
import { extractTypeDefinitions } from "./extract/type-definitions";

import { parse } from "graphql";

export * from "./typeInfo";
export * from "./transform";

interface ParserOptions {
  extractors?: SchemaExtractor[];
  transforms?: TypeInfoTransforms[];
}

export function parseSchema(schema: string, options?: ParserOptions): TypeInfo {
  const astNode = parse(schema);

  let info = createTypeInfo();

  const typeDefinitions = extractTypeDefinitions(astNode);

  const extracts =
    options && options.extractors ? options.extractors : extractors;

  for (const extract of extracts) {
    extract(astNode, info, typeDefinitions);
  }

  info = performTransforms(info, finalizePropertyDef);

  if (options && options.transforms) {
    for (const transform of options.transforms) {
      info = performTransforms(info, transform);
    }
  }

  return info;
}
