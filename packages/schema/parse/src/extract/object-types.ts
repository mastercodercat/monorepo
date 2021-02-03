import {
  TypeInfo,
  ObjectDefinition,
  createObjectDefinition,
} from "../typeInfo";
import {
  extractFieldDefinition,
  extractListType,
  extractNamedType,
  State,
} from "./object-types-utils";
import { TypeDefinitions } from "./type-definitions";

import {
  DocumentNode,
  TypeDefinitionNode,
  NonNullTypeNode,
  NamedTypeNode,
  ListTypeNode,
  FieldDefinitionNode,
  visit,
  DirectiveNode,
} from "graphql";

const visitorEnter = (
  objectTypes: ObjectDefinition[],
  typeDefinitions: TypeDefinitions,
  state: State
) => ({
  ObjectTypeDefinition: (node: TypeDefinitionNode) => {
    // Skip non-custom types
    if (node.name.value === "Query" || node.name.value === "Mutation") {
      return;
    }

    // Skip imported types
    if (
      node.directives &&
      node.directives.findIndex(
        (dir: DirectiveNode) => dir.name.value === "imported"
      ) > -1
    ) {
      return;
    }

    // Create a new TypeDefinition
    const type = createObjectDefinition({ type: node.name.value });
    objectTypes.push(type);
    state.currentType = type;
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
  FieldDefinition: (node: FieldDefinitionNode) => {
    extractFieldDefinition(node, state);
  },
});

const visitorLeave = (state: State) => ({
  ObjectTypeDefinition: (_node: TypeDefinitionNode) => {
    state.currentType = undefined;
  },
  FieldDefinition: (_node: FieldDefinitionNode) => {
    state.currentProperty = undefined;
  },
  NonNullType: (_node: NonNullTypeNode) => {
    state.nonNullType = false;
  },
});

export function extractObjectTypes(
  astNode: DocumentNode,
  typeInfo: TypeInfo,
  typeDefinitions: TypeDefinitions
): void {
  const state: State = {};

  visit(astNode, {
    enter: visitorEnter(typeInfo.objectTypes, typeDefinitions, state),
    leave: visitorLeave(state),
  });
}
