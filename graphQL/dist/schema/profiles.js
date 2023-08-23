// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
import { getAccountData, getUserData } from '../services/profileService';
// your data.
export const typeDefs = `#graphql

  type User {
    uuid: String!
    firstName: String!
    lastName: String!
    email: String!
    accounts: [UserAccount!]!
  }

  type UserAccount {
    accountId: String!
    accountName: String!
    type: String!
    role: String!
  }

  type Account {
    uuid: String!
    name: String!
    type: String!
    addresses: [Address!]!
    users: [User!]!
  }

  type Address {
    address: String!
    city: String!
    state: String!
    country: String!
    postalCode: String!
  }

  type Query {
    user (uid: String!): User
    account (accountId: String!): Account
  }
`;
export const resolvers = {
    Query: {
        user: (parent, args, contextValue, info) => getUserData(args.uid),
        account: (parent, args, contextValue, info) => getAccountData(args.accountId),
    },
};
