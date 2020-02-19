import gql from "graphql-tag";
import createPermissionDirective from "./directives/hasPermission";
import createRoleDirective from "./directives/hasRole";
import createAuthenticatedDirective from "./directives/isAuthenticated";

interface IOptions {
  hasPermissionHandler: (ctx: any, permissions: string[]) => void;
  hasRoleHandler: (ctx: any, roles: string[]) => void;
  isAuthenticatedHandler: (ctx: any) => void;
}

const createAuthDirectives = (options?: Partial<IOptions>): any => ({
  hasPermission: createPermissionDirective(options?.hasPermissionHandler),
  hasRole: createRoleDirective(options?.hasRoleHandler),
  isAuthenticated: createAuthenticatedDirective(options?.isAuthenticatedHandler),
});

const authTypeDefs = gql`
  directive @isAuthenticated on FIELD | FIELD_DEFINITION | INPUT_FIELD_DEFINITION
  directive @hasPermission(permissions: [String!]!) on FIELD | FIELD_DEFINITION | INPUT_FIELD_DEFINITION
  directive @hasRole(roles: [String!]!) on FIELD | FIELD_DEFINITION | INPUT_FIELD_DEFINITION
`;

export { createAuthDirectives, authTypeDefs };
