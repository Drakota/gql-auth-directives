import { GraphQLField, GraphQLInputField, GraphQLInputObjectType } from "graphql";
import { SchemaDirectiveVisitor } from "graphql-tools";
import { getMutations } from "../utils/getMutations";
import defaultHandler from "../handlers/isAuthenticatedHandler";

export default (overiddeHandler: ((ctx: any) => void) | undefined) => {
  const handler = overiddeHandler || defaultHandler;

  return class IsAuthenticatedDirective extends SchemaDirectiveVisitor {
    public visitFieldDefinition(field: GraphQLField<any, any>): void {
      const { resolve } = field;

      field.resolve = async function(...args) {
        const ctx = args[2];
        handler(ctx);
        return resolve!.apply(this, args);
      };
    }

    public visitInputFieldDefinition(field: GraphQLInputField, details: { objectType: GraphQLInputObjectType }) {
      const { name, defaultValue } = field;

      const mutationsForInput = getMutations(this.schema, details);
      mutationsForInput.forEach(mutation => {
        const { resolve } = mutation;

        mutation.resolve = async (...args) => {
          const params = args[1];
          const subKey = Object.values(params).find(el => el && el[name]);

          if (params[name] !== defaultValue || (subKey && subKey[name] !== defaultValue)) {
            const ctx = args[2];
            handler(ctx);
          }
          return resolve!.apply(this, args);
        };
      });
    }
  };
};
