import axios from 'axios';
import { config } from '../config/index.js';
const clientCreds =
  'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3N0YWdlLmlkLnRyaW1ibGVjbG91ZC5jb20iLCJleHAiOjE2OTI3ODY2MDAsIm5iZiI6MTY5Mjc4MzAwMCwiaWF0IjoxNjkyNzgzMDAwLCJqdGkiOiI2ZjMzNzFiOTU4YWE0MTI2YmIyMTkyZjZjNzkwZDk5NyIsImp3dF92ZXIiOjIsInN1YiI6ImE4MjBkYzE2LTllYTAtNGM1Yi1iNjI0LThkNTFiNjFkZDA5NCIsImFwcGxpY2F0aW9uX25hbWUiOiJUQ01pZGRsZXdhcmUtRGV2IiwiaWRlbnRpdHlfdHlwZSI6ImFwcGxpY2F0aW9uIiwiYXV0aF90aW1lIjoxNjkyNzgzMDAwLCJhbXIiOlsiY2xpZW50X2NyZWRlbnRpYWxzIl0sImF1ZCI6WyI5YzMwYzIyYi0zMzRmLTQzY2YtYmJlNS01MmE5MTVlY2Q4MDYiXSwic2NvcGUiOiJBWERpc2NvdmVyeSJ9.VB35RyPHMhErTAhzxJuacrRJRqU2CftV5Fgu4g83707i3Pjs4b3R-0N48c0349iNYQc_aVnGjUpI7lySA7fS_HOp7ldwCGyJv003770MYTJPKyILDkVMqz6-ihNqIRKcyIpUZR-JdYmqSvwDAZvlkQaJ1deLKe_ye7nMpugqCAPN-aGOUqEXyW_MWM5P2UL_q6utYEhMySuC52quYdyQ69zk3_qeKvVe0wIW9wE-Z4Tbtekux0snzolLDvceKqa00DgnXBaKHMvcpu4R13TQWd1EKY1gi6unOfM1PLlX55kLTDPMC8yBoU3sWQXXv--_iqr6m00K42dtiBTs2vmpzA';
export const getUserData = async (userId: String) => {
  // Get user details
  let response = await axios.get(
    config.service.profiles.baseUrl +
      config.service.profiles.endpoints.userInfo.replace(
        '<USERID>',
        userId.trim()
      ),
    {
      headers: {
        Authorization: `Bearer ${clientCreds}`,
        'Content-Type': 'application/json',
      },
    }
  );
  let result = response.data;

  // Get accounts for a user
  result.accounts = [];
  let userAccountsResponse = await axios.post(
    config.service.profiles.baseUrl +
      config.service.profiles.endpoints.userAccount.replace(
        '<USERID>',
        userId.trim()
      ),
    {
      sortBy: 'updatedTimeStamp',
      order: 'DESC',
      relations: [
        {
          type: 'accounts',
          relationName: 'member-of',
          expr: '',
          sourceExpr: '',
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${clientCreds}`,
        'Content-Type': 'application/json',
      },
    }
  );

  // Get account details for each account
  if (
    userAccountsResponse.data.data &&
    userAccountsResponse.data.data.length > 0
  ) {
    let accountDetailsPromises = [];

    for (const account of userAccountsResponse.data.data) {
      accountDetailsPromises.push(
        axios
          .get(
            config.service.profiles.baseUrl +
              config.service.profiles.endpoints.accountDetails.replace(
                '<ACCOUNTID>',
                account.targetProfileUuid
              ),
            {
              headers: {
                Authorization: `Bearer ${clientCreds}`,
                'Content-Type': 'application/json',
              },
            }
          )
          .then((response) => {
            return {
              ...response.data,
              role: account.attributes.role,
            };
          })
      );
    }

    let allPromiseResults = await Promise.allSettled(accountDetailsPromises);

    allPromiseResults.forEach((promiseResult) => {
      if (promiseResult.status === 'fulfilled') {
        result.accounts.push({
          accountId: promiseResult.value.uuid,
          accountName: promiseResult.value.name,
          role: promiseResult.value.role,
          type: promiseResult.value.type,
        });
      }
    });
  }
  return result;
};

export const getAccountData = async (accountId: String) => {
  let result = {};

  // Get account details
  let response = await axios.get(
    config.service.profiles.baseUrl +
      config.service.profiles.endpoints.accountDetails.replace(
        '<ACCOUNTID>',
        accountId.trim()
      ),
    {
      headers: {
        Authorization: `Bearer ${clientCreds}`,
        'Content-Type': 'application/json',
      },
    }
  );

  result = {
    uuid: response.data.uuid,
    name: response.data.name,
    type: response.data.type,
  };
  // Get addresses linked to an account

  let addressesResponse = await axios.post(
    config.service.profiles.baseUrl +
      config.service.profiles.endpoints.addresses,
    {
      relations: [
        {
          targetProfileFilters: {
            type: 'accounts',
            relationName: 'of',
            expr: 'type=in=(shipping,billing)',
            targetExpr: `trn==trn:profiles:accounts:${accountId}`,
          },
        },
      ],
      context: `trn:profiles:accounts:${accountId}`,
    },
    {
      headers: {
        Authorization: `Bearer ${clientCreds}`,
        'Content-Type': 'application/json',
      },
    }
  );

  result['addresses'] = [...addressesResponse.data.data];

  // Get users of each account
  let usersResponse = await axios.post(
    config.service.profiles.baseUrl + config.service.profiles.endpoints.users,
    {
      relations: [
        {
          targetProfileFilters: {
            type: 'accounts',
            relationName: 'member-of',
            expr: 'role=in=(owner,secondary_owner,admin,product_user)',
            targetExpr: `trn==trn:profiles:accounts:${accountId}`,
          },
        },
      ],
      context: `trn:profiles:accounts:${accountId}`,
    },
    {
      headers: {
        Authorization: `Bearer ${clientCreds}`,
        'Content-Type': 'application/json',
      },
    }
  );
  result['users'] = usersResponse.data.data;

  return result;
};
