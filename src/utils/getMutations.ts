import { GraphQLField, GraphQLSchema, GraphQLInputObjectType } from "graphql";

export const getMutations = (
  schema: GraphQLSchema,
  details: { objectType: GraphQLInputObjectType },
): GraphQLField<
  any,
  any,
  {
    [key: string]: any;
  }
>[] => {
  const mutationType = schema.getMutationType();
  if (!mutationType) {
    return [];
  }

  const mutations = Object.values(mutationType.getFields());
  return mutations.filter(mutation => mutation.args.find(arg => (arg.type as any).ofType === details.objectType));
};
