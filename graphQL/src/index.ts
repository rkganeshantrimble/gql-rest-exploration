import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

import {
  getAccountData,
  getAccountDataByAccountId,
  getAddressessLinkedToAccount,
  getUserData,
  getUsersLinkedToAccount,
} from './services/profileService.js';

// your data.
// type Account {
//   uuid: String!
//   name: String!
//   type: String!
//   addresses: [Address!]!
//   users: [User!]!
// }
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
    accountData(accountId: String!):Account
    accountAddressess(accountId: String!):Address
    accountUsers(accountId: String!):[User]
  }
`;

const resolvers = {
  Query: {
    user: (parent, args, contextValue, info) => getUserData(args.uid),
    account: (parent, args, contextValue, info) =>
      getAccountData(args.accountId, info),
    accountData: (parent, args, contextValue, info) =>
      getAccountDataByAccountId(args.accountId),
    accountAddressess: (parent, args, contextValue, info) =>
      getAddressessLinkedToAccount(args.accountId),
    accountUsers: (parent, args, contextValue, info) =>
      getUsersLinkedToAccount(args.accountId, info),
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });

console.log(`🚀  Server ready at: ${url}`);
