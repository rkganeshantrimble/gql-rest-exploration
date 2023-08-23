import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { getAccountData, getUserData } from './services/profileService.js';
// your data.
const typeDefs = `#graphql

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
const resolvers = {
    Query: {
        user: (parent, args, contextValue, info) => getUserData(args.uid),
        account: (parent, args, contextValue, info) => getAccountData(args.accountId),
    },
};
const server = new ApolloServer({
    typeDefs,
    resolvers,
});
const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });
console.log(`🚀  Server ready at: ${url}`);
