import { GraphQLField, GraphQLInputField, GraphQLInputObjectType, defaultFieldResolver } from "graphql";
import { SchemaDirectiveVisitor } from "graphql-tools";

import { isAuthenticatedHandler } from "../defaultHandlers";

export default (overiddeHandler: ((ctx: any) => void) | undefined) => {
  const handler = overiddeHandler || isAuthenticatedHandler;

  return class IsAuthenticatedDirective extends SchemaDirectiveVisitor {
    public visitFieldDefinition(field: GraphQLField<any, any>): void {
      const { resolve = defaultFieldResolver } = field;

      field.resolve = async function(...args) {
        const ctx = args[2];
        handler(ctx);
        return resolve.apply(this, args);
      };
    }

    public visitInputFieldDefinition(field: GraphQLInputField, details: { objectType: GraphQLInputObjectType }) {
      const { name, defaultValue } = field;

      const mutations = Object.values(this.schema.getMutationType()?.getFields() || []);
      const queries = Object.values(this.schema.getQueryType()?.getFields() || []);

      mutations.filter(this.filterInputPred(details)).forEach(mutation => {
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

      queries.filter(this.filterInputPred(details)).forEach(query => {
        const { resolve } = query;

        query.resolve = async (...args) => {
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

    private filterInputPred(details: { objectType: GraphQLInputObjectType }) {
      return (
        mutation: GraphQLField<
          any,
          any,
          {
            [key: string]: any;
          }
        >,
      ) => mutation.args.find(arg => (arg.type as any).ofType === details.objectType);
    }
  };
};
