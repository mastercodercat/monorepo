import {
  TypeInfo,
  QueryDefinition,
  createQueryDefinition,
  createMethodDefinition,
} from "../typeInfo";
import {
  extractInputValueDefinition,
  extractListType,
  extractNamedType,
  State,
} from "./query-types-utils";
import { TypeDefinitions } from "./type-definitions";

import {
  DocumentNode,
  ObjectTypeDefinitionNode,
  NonNullTypeNode,
  NamedTypeNode,
  ListTypeNode,
  FieldDefinitionNode,
  InputValueDefinitionNode,
  visit,
} from "graphql";

const visitorEnter = (
  queryTypes: QueryDefinition[],
  state: State,
  typeDefinitions: TypeDefinitions
) => ({
  ObjectTypeDefinition: (node: ObjectTypeDefinitionNode) => {
    const nodeName = node.name.value;

    if (nodeName !== "Query" && nodeName !== "Mutation") {
      return;
    }

    const query = createQueryDefinition({ type: nodeName });
    queryTypes.push(query);
    state.currentQuery = query;
  },
  FieldDefinition: (node: FieldDefinitionNode) => {
    const query = state.currentQuery;

    if (!query) {
      return;
    }

    const method = createMethodDefinition({
      type: query.type,
      name: node.name.value,
    });
    query.methods.push(method);
    state.currentMethod = method;
  },
  InputValueDefinition: (node: InputValueDefinitionNode) => {
    extractInputValueDefinition(node, state);
  },
  NonNullType: (_node: NonNullTypeNode) => {
    state.nonNullType = true;
  },
  NamedType: (node: NamedTypeNode) => {
    extractNamedType(node, state, typeDefinitions);
  },
  ListType: (_node: ListTypeNode) => {
    extractListType(state);
  },
});

const visitorLeave = (state: State) => ({
  ObjectTypeDefinition: (_node: ObjectTypeDefinitionNode) => {
    state.currentQuery = undefined;
  },
  FieldDefinition: (_node: FieldDefinitionNode) => {
    state.currentMethod = undefined;
    state.currentReturn = undefined;
  },
  InputValueDefinition: (_node: InputValueDefinitionNode) => {
    state.currentArgument = undefined;
  },
  NonNullType: (_node: NonNullTypeNode) => {
    state.nonNullType = false;
  },
});

export function extractQueryTypes(
  astNode: DocumentNode,
  typeInfo: TypeInfo,
  typeDefinitions: TypeDefinitions
): void {
  const state: State = {};

  visit(astNode, {
    enter: visitorEnter(typeInfo.queryTypes, state, typeDefinitions),
    leave: visitorLeave(state),
  });
}
